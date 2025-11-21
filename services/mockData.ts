
import { Project, ProjectStatus, PlanType, FinanceRecord, ProjectLog, MaintenanceStatus, Client, PaymentStatus } from "../types";

export const initialClients: Client[] = [
  {
    id: 'c1',
    name: 'Juan Pérez',
    company: 'Constructora Pérez',
    email: 'juan@construccion.com',
    phone: '+51 999 999 999',
    registeredAt: '2023-10-01',
    notes: 'Cliente recurrente.'
  },
  {
    id: 'c2',
    name: 'Maria Bakery',
    company: 'Pastelería Dulce',
    email: 'contacto@dulce.com',
    registeredAt: '2023-11-15'
  },
  {
    id: 'c3',
    name: 'Carlos Tech',
    company: 'TechStart Inc',
    email: 'ceo@techstart.com',
    registeredAt: '2023-12-01'
  }
];

export const initialProjects: Project[] = [
  {
    id: '1',
    clientId: 'c1',
    clientName: 'Constructora Pérez',
    planType: PlanType.ECOMMERCE,
    budget: 900,
    status: ProjectStatus.PRODUCTION,
    paymentStatus: PaymentStatus.DEPOSIT_PAID,
    maintenanceStatus: MaintenanceStatus.FREE_PERIOD,
    deadline: '2023-12-15',
    alertNeeds: '',
    discoveryData: {
      objective: 'Vender materiales de construcción online',
      currentUrl: 'No tiene',
      buyerPersona: 'Maestros de obra y contratistas, 30-50 años.',
      competitors: 'Sodimac, Maestro, Promart',
      references: 'Me gusta el estilo limpio de Apple pero con colores industriales.',
      materialStatus: 'Logo en JPG (baja calidad), Faltan fotos de productos.'
    },
    checklists: {
      depositPaid: true,
      infoReceived: true,
      fillerAccepted: false,
      finalPaymentPaid: false
    },
    devUrl: 'https://dev.leoneagencia.com/constructora'
  },
  {
    id: '2',
    clientId: 'c2',
    clientName: 'Pastelería Dulce',
    planType: PlanType.SINGLE,
    budget: 150,
    status: ProjectStatus.PROSPECTION,
    paymentStatus: PaymentStatus.PENDING,
    deadline: '2023-11-30',
    alertNeeds: 'Presupuesto muy bajo. El precio base es $300.'
  },
  {
    id: '3',
    clientId: 'c3',
    clientName: 'TechStart Inc',
    planType: PlanType.CUSTOM,
    budget: 1500,
    status: ProjectStatus.WAITING_RESOURCES,
    paymentStatus: PaymentStatus.DEPOSIT_PAID,
    maintenanceStatus: MaintenanceStatus.FREE_PERIOD,
    deadline: '2024-01-20',
    alertNeeds: '',
    description: 'Plataforma educativa a medida',
    checklists: {
      depositPaid: true,
      infoReceived: false,
      fillerAccepted: false,
      finalPaymentPaid: false
    }
  }
];

export const initialFinance: FinanceRecord[] = [
  { id: 'f1', type: 'Ingreso', amount: 450, description: 'Adelanto 50% Constructora', date: '2023-10-01' },
  { id: 'f2', type: 'Gasto', amount: 50, description: 'Servidor Hosting', date: '2023-10-02' },
  { id: 'f3', type: 'Gasto', amount: 120, description: 'Licencia Elementor Pro', date: '2023-10-05' },
  { id: 'f4', type: 'Ingreso', amount: 10, description: 'Mantenimiento Mensual - Clínica Dental', date: '2023-10-15' },
];

export const initialLogs: ProjectLog[] = [
  { id: 'l1', projectId: '1', comment: 'Requerimientos iniciales tomados.', createdAt: '2023-09-20', author: 'Admin' },
  { id: 'l2', projectId: '1', comment: 'Diseño aprobado por el cliente.', createdAt: '2023-10-05', author: 'Admin' },
  { id: 'l3', projectId: '3', comment: 'Anticipo recibido. Esperando fotos del equipo.', createdAt: '2023-12-02', author: 'Admin' },
];