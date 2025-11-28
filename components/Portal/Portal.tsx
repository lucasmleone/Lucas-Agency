import React, { useState, useEffect } from 'react';
import { PortalLogin } from './PortalLogin';
import { PortalDashboard } from './PortalDashboard';
import { Lock } from 'lucide-react';

interface PortalProps {
    token: string;
}

export const Portal: React.FC<PortalProps> = ({ token }) => {
    const [status, setStatus] = useState<'loading' | 'login' | 'authenticated' | 'expired' | 'error'>('loading');
    const [portalData, setPortalData] = useState<any>(null);
    const [sessionToken, setSessionToken] = useState<string | null>(null);

    useEffect(() => {
        checkPortal();
    }, [token]);

    const checkPortal = async () => {

        try {
            const url = `/api/portal/${token}/check`;

            const res = await fetch(url);


            if (res.status === 410) {

                setStatus('expired');
                return;
            }
            if (!res.ok) {

                setStatus('error');
                return;
            }
            const data = await res.json();

            setPortalData(data);
            setStatus('login');
        } catch (error) {
            console.error('[Portal] Error checking portal:', error);
            setStatus('error');
        }
    };

    const handlePinSubmit = async (pin: string) => {
        const res = await fetch(`/api/portal/${token}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });

        if (!res.ok) {
            throw new Error('Invalid PIN');
        }

        const { token: sessionToken } = await res.json();
        setSessionToken(sessionToken);

        // Fetch portal data
        await loadPortalData(sessionToken);
    };

    const loadPortalData = async (sToken: string) => {
        const res = await fetch(`/api/portal/${token}/data`, {
            headers: { 'x-portal-token': sToken }
        });

        if (!res.ok) {
            setStatus('error');
            return;
        }

        const data = await res.json();
        setPortalData({ ...portalData, ...data });
        setStatus('authenticated');
    };

    const handleAction = async (action: string) => {
        if (!sessionToken) return;

        const res = await fetch(`/api/portal/${token}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-portal-token': sessionToken
            },
            body: JSON.stringify({ action })
        });

        if (!res.ok) {
            throw new Error('Action failed');
        }

        // Reload data
        await loadPortalData(sessionToken);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Cargando portal...</p>
                </div>
            </div>
        );
    }

    if (status === 'expired' || status === 'error') {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {status === 'expired' ? 'Acceso Expirado' : 'Portal No Disponible'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {status === 'expired'
                            ? 'El acceso a este proyecto ha finalizado. Si necesitas información adicional, por favor contacta directamente a la agencia.'
                            : 'No pudimos encontrar este portal. Por favor verifica el enlace.'}
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm font-bold text-gray-900 mb-2">Agencia Leone</p>
                        <p className="text-sm text-gray-600">contacto@lucasagency.com</p>
                        <p className="text-sm text-gray-600">+54 9 11 XXXX-XXXX</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'login' && portalData) {
        return (
            <PortalLogin
                clientName={portalData.client}
                projectName={portalData.project}
                onSubmit={handlePinSubmit}
            />
        );
    }

    if (status === 'authenticated' && portalData?.project && portalData?.milestones) {
        return (
            <PortalDashboard
                project={portalData.project}
                milestones={portalData.milestones}
                onAction={handleAction}
            />
        );
    }

    return null;
};
