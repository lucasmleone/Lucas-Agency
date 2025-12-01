
export enum ProjectStatus {
  DISCOVERY = '1. Discovery',
  PROPOSAL = '2. Propuesta',
  WAITING_RESOURCES = '3. Espera Recursos',
  PRODUCTION = '4. Producción',
  DELIVERY = '5. Cierre y Entrega',
  CANCELLED = '6. Cancelado',
  LOST = '6. Perdido',
  DELIVERED = '7. Entregado'
}

export enum PaymentStatus {
  PENDING = 'Pendiente',
  DEPOSIT_PAID = 'Anticipo (50%) Recibido',
  FULLY_PAID = 'Pagado (100%)'
}

export enum PlanType {
  LANDING = 'Landing Page',
  CORPORATE = 'Web Corporativa',
  CUSTOM = 'Personalizado'
}

export enum MaintenanceStatus {
  FREE_PERIOD = "FREE_PERIOD",
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED"
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
  materials?: string;
  otherComments?: string;
}

export interface ProjectChecklists {
  depositPaid: boolean;
  infoReceived: boolean;
  fillerAccepted: boolean;
  finalPaymentPaid: boolean;
}

export interface DeliveryData {
  webUrl?: string;
  webUser?: string;
  webPass?: string;
  emailUrl?: string;
  emailUser?: string;
  emailPass?: string;
  reportLink?: string;
  finalUrl?: string;
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string; // Denormalized for easier display
  planType: PlanType;
  // budget: number; // Removed in favor of FinanceRecords
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
  proposalToken?: string;

  // Blocking Status
  blockedStatus?: boolean;
  blockedReason?: string;
  blockedSince?: string; // ISO date

  // Pricing Fields
  basePrice?: number; // Base price according to plan
  customPrice?: number; // Custom/quoted price
  discount?: number; // Discount amount (can be % or fixed)
  discountType?: 'percentage' | 'fixed'; // Type of discount
  finalPrice?: number; // Calculated final price
  pricingNotes?: string; // Notes about pricing/quote
  isHourlyQuote?: boolean;
  customHours?: number;
  hourlyRate?: number;
  advancePercentage?: number; // Percentage of advance payment (default 50)
  advancePaymentInfo?: string; // Client's payment proof/note
  nextMaintenanceDate?: string; // Next scheduled maintenance task date

  // Portal Fields
  portalToken?: string;
  portalPin?: string;
  portalEnabled?: boolean;
  portalExpiresAt?: string;
  driveLink?: string;
  requirements?: string[];

  // Delivery Fields
  deliveryData?: DeliveryData;
  resourcesSent?: boolean; // Flag to indicate if client confirmed resources
}

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  status: 'pending' | 'active' | 'completed';
  sortOrder: number;
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
  projectId?: string; // Optional for general expenses, required for project payments
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

// =====================================================
// MAINTENANCE SYSTEM
// =====================================================

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  notes?: string;
}

export interface MonthlyTask {
  id: string;
  month: number;                  // 1, 2, 3, etc.
  date: string;                   // Fecha programada (ISO string)
  completed: boolean;
  checklist: ChecklistItem[];
  reportSent: boolean;
}

export interface MaintenanceTask {
  id: string;
  projectId: string;
  createdAt: string;              // Fecha de creación (= fecha entrega)
  freeUntil: string;              // createdAt + 60 días
  status: 'active' | 'requires_payment' | 'inactive';
  monthlyTasks: MonthlyTask[];
}

// Checklist estándar para mantenimiento
export const MAINTENANCE_CHECKLIST: Omit<ChecklistItem, 'completed' | 'notes'>[] = [
  { id: '1', text: 'Verificar estado online (Uptime)' },
  { id: '2', text: 'Backup Manual (UpdraftPlus) a nube externa' },
  { id: '3', text: 'Revisión de Logs de Seguridad (Bloqueos/Intentos de login)' },
  { id: '4', text: 'Actualización de Plugins (Uno a uno/Lote)' },
  { id: '5', text: 'Actualización de WordPress Core y Tema' },
  { id: '6', text: 'Limpieza de SPAM y vaciado de Caché' },
  { id: '7', text: 'Test visual en incógnito y prueba de formularios' }
];


export interface NoteItem {
  id: string;
  type: 'link' | 'text';
  title?: string; // Optional title for the item
  content: string;
}

export interface Note {
  id: string;
  title: string;
  category: string;
  items: NoteItem[];
  is_pinned: boolean;
  position: number;
  created_at: string;
  linkedEntityType?: 'client' | 'project';
  linkedEntityId?: string;
  updated_at: string;
}

export interface AddOnTemplate {
  id: number;
  name: string;
  description?: string;
  default_price: number;
}

export interface ProjectAddOn {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  price: number;
}
