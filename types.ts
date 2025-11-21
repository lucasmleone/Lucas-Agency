
export enum ProjectStatus {
  PROSPECTION = '1. Prospección',
  DISCOVERY = '2. Discovery',
  PROPOSAL = '3. Propuesta',
  WAITING_RESOURCES = '4. Espera Recursos',
  PRODUCTION = '5. Producción',
  DELIVERY = '6. Cierre y Entrega',
  CANCELLED = '7. Cancelado',
  LOST = '7. Perdido',
  DELIVERED = '8. Entregado'
}

export enum PaymentStatus {
  PENDING = 'Pendiente',
  DEPOSIT_PAID = 'Anticipo (50%) Recibido',
  FULLY_PAID = 'Pagado (100%)'
}

export enum PlanType {
  SINGLE = 'Single Page ($300)',
  MULTI = 'Multipage ($600)',
  ECOMMERCE = 'E-commerce ($900)',
  CUSTOM = 'Personalizado (Cotizar)'
}

export enum MaintenanceStatus {
  FREE_PERIOD = 'Periodo Gratuito (2 Meses)',
  ACTIVE_PAID = 'Activo ($10/mes)',
  INACTIVE = 'Inactivo/Cancelado'
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  registeredAt: string;
  notes?: string;
}

export interface DiscoveryData {
  buyerPersona: string;
  competitors: string;
  references: string;
  materialStatus: string;
  currentUrl: string;
  objective: string;
}

export interface ProjectChecklists {
  depositPaid: boolean;
  infoReceived: boolean;
  fillerAccepted: boolean;
  finalPaymentPaid: boolean;
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string; // Denormalized for easier display
  planType: PlanType;
  budget: number;
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  maintenanceStatus?: MaintenanceStatus;
  deadline: string;
  alertNeeds?: string; // AI generated warning
  description?: string;
  
  // New Fields for 7-Stage Workflow
  discoveryData?: DiscoveryData;
  checklists?: ProjectChecklists;
  devUrl?: string;
}

export interface ProjectLog {
  id: string;
  projectId: string;
  comment: string;
  createdAt: string;
  author: 'Admin' | 'Sistema';
}

export interface FinanceRecord {
  id: string;
  type: 'Ingreso' | 'Gasto';
  amount: number;
  description: string;
  date: string;
}

export interface AIAnalysisResult {
  alert: string;
  viabilityScore: number;
  suggestedPlan?: string;
}

export interface AIResponseAnalysis {
  decision: 'ACCEPTED' | 'REJECTED' | 'UNCLEAR' | 'MORE_INFO';
  summary: string;
  sentimentScore: number;
}
