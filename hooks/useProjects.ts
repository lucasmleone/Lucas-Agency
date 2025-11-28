import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectLog, Client, FinanceRecord, ProjectStatus, PlanType, PaymentStatus, MaintenanceStatus } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { getBasePriceForPlan, calculateFinalPrice } from '../utils/pricing';

export const useProjects = () => {
    const { isAuthenticated } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [finances, setFinances] = useState<FinanceRecord[]>([]);
    const [logs, setLogs] = useState<ProjectLog[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const [p, f, l, c] = await Promise.all([
                apiService.getProjects(),
                apiService.getFinances(),
                apiService.getLogs(),
                apiService.getClients()
            ]);
            setProjects(p);
            setFinances(f);
            setLogs(l);
            setClients(c);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        if (!isAuthenticated) return;

        const intervalId = setInterval(() => {
            loadData();
        }, 60000); // 60 seconds

        return () => clearInterval(intervalId);
    }, [isAuthenticated, loadData]);

    const addProject = async (projectData: any) => {
        const client = clients.find(c => c.id === projectData.clientId);
        const basePrice = getBasePriceForPlan(projectData.plan as PlanType);

        // Send without ID, let backend assign it
        const tempProject: any = {
            clientId: projectData.clientId,
            clientName: client ? client.name : 'Desconocido',
            planType: projectData.plan,
            status: ProjectStatus.DISCOVERY,
            paymentStatus: PaymentStatus.PENDING,
            maintenanceStatus: MaintenanceStatus.FREE_PERIOD,
            deadline: projectData.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            alertNeeds: '',
            description: '',
            discoveryData: {
                buyerPersona: '', competitors: '', references: '', materialStatus: '', currentUrl: '', objective: ''
            },
            // Initialize pricing fields
            basePrice: basePrice,
            finalPrice: basePrice
        };
        const savedProject = await apiService.addProject(tempProject);
        // Ensure ID is string for frontend consistency
        savedProject.id = String(savedProject.id);
        setProjects(prev => [...prev, savedProject]);

        const newLog: any = {
            projectId: savedProject.id,
            author: 'Admin',
            comment: `Proyecto creado manualmente.`,
            createdAt: new Date().toISOString().split('T')[0]
        };
        const savedLog = await apiService.addLog(newLog);
        savedLog.id = String(savedLog.id);
        setLogs(prev => [...prev, savedLog]);
    };

    const updateProject = async (id: string, updatedFields: Partial<Project>) => {
        const project = projects.find(p => p.id === id);
        if (project) {
            const updatedProject = { ...project, ...updatedFields };

            // DEBUG: Log what we're sending
            console.log('[useProjects] Updating project:', id);
            console.log('[useProjects] Portal fields being sent:', {
                portalToken: updatedProject.portalToken,
                portalPin: updatedProject.portalPin,
                portalEnabled: updatedProject.portalEnabled
            });

            await apiService.updateProject(updatedProject);
            setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
        }

        const deleteProject = async (id: string) => {
            await apiService.deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
        };

        const addLog = async (projectId: string, text: string) => {
            const newLog: any = {
                projectId,
                author: 'Admin',
                comment: text,
                createdAt: new Date().toISOString().split('T')[0]
            };
            const savedLog = await apiService.addLog(newLog);
            savedLog.id = String(savedLog.id);
            setLogs(prev => [savedLog, ...prev]);
        };

        const updateLog = async (logId: string, text: string) => {
            const log = logs.find(l => l.id === logId);
            if (log) {
                const updatedLog = { ...log, comment: text };
                await apiService.updateLog(updatedLog);
                setLogs(prev => prev.map(l => l.id === logId ? updatedLog : l));
            }
        };

        const addClient = async (clientData: any) => {
            const client: any = {
                ...clientData,
                registeredAt: new Date().toISOString().split('T')[0]
            };
            const savedClient = await apiService.addClient(client);
            savedClient.id = String(savedClient.id);
            setClients(prev => [...prev, savedClient]);
        };

        const updateClient = async (id: string, clientData: any) => {
            const client = clients.find(c => c.id === id);
            if (client) {
                const updatedClient = { ...client, ...clientData };
                await apiService.updateClient(updatedClient);
                setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
            }
        };

        const deleteClient = async (id: string) => {
            await apiService.deleteClient(id);
            setClients(prev => prev.filter(c => c.id !== id));
        };

        const addFinance = async (financeData: any) => {
            const newRecord: any = {
                projectId: financeData.projectId,
                type: financeData.type,
                description: financeData.description,
                amount: Number(financeData.amount),
                date: new Date().toISOString().split('T')[0]
            };
            const savedRecord = await apiService.addFinance(newRecord);
            savedRecord.id = String(savedRecord.id);
            setFinances(prev => [...prev, savedRecord]);
        };

        const deleteFinance = async (id: string) => {
            await apiService.deleteFinance(id);
            setFinances(prev => prev.filter(f => f.id !== id));
        };

        return {
            projects,
            finances,
            logs,
            clients,
            loading,
            refreshData: loadData,
            addProject,
            updateProject,
            deleteProject,
            addLog,
            updateLog,
            addClient,
            updateClient,
            deleteClient,
            addFinance,
            deleteFinance
        };
    };
