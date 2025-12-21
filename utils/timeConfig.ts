import { PlanType, ProjectAddOn } from '../types';

/**
 * Time Configuration for Projects
 * Parallel to pricing.ts but for time estimation
 */

// =============================================================================
// PLAN HOURS CONFIGURATION
// =============================================================================

export const PLAN_HOURS: Record<string, number> = {
    'Landing Page': 32,
    'Web Corporativa': 60,
    'Personalizado': 0, // Uses customHours
    // Legacy plans
    'Multipage': 80,
    'E-commerce': 120,
    'Single Page': 24,
};

// =============================================================================
// ADD-ON HOURS CONFIGURATION
// =============================================================================

export const ADDON_HOURS: Record<string, number> = {
    'Chat WhatsApp (Botón flotante)': 2,
    'Blog / Noticias': 8,
    'Multilenguaje (Infraestructura)': 6,
    'Reservas y Turnos (Booking)': 12,
    'Catálogo (Modo Vidriera)': 16,
    'Academia Online (LMS)': 24,
    'E-commerce Full': 40,
    // Fallback for unknown add-ons
    'default': 4,
};

// =============================================================================
// BUFFER CONFIGURATION (30% Intelligent Buffer)
// =============================================================================

export const BUFFER_CONFIG = {
    TECHNICAL: 0.20,  // 20% for technical issues and production
    ADMIN: 0.10,      // 10% "Sales Buffer" for admin delays
    TOTAL: 0.30,      // Total buffer multiplier
};

// =============================================================================
// WORK CONFIGURATION
// =============================================================================

export const WORK_CONFIG = {
    DEFAULT_DAILY_HOURS: 4,
    MIN_DAILY_HOURS: 1,
    MAX_DAILY_HOURS: 6, // Updated to 6h per user request
    WORK_DAYS_PER_WEEK: 5, // Mon-Fri by default
};

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * Get base hours for a plan type
 */
export const getBaseHoursForPlan = (planType: PlanType | string): number => {
    return PLAN_HOURS[planType] ?? 0;
};

/**
 * Get hours for an add-on by name
 */
export const getHoursForAddOn = (addonName: string): number => {
    return ADDON_HOURS[addonName] ?? ADDON_HOURS['default'];
};

/**
 * Calculate total hours for a project including buffer
 * @param planType - The plan type
 * @param addons - Array of add-ons
 * @param customHours - Custom hours (overrides plan hours)
 * @param customBufferPercent - Optional custom buffer percentage (0-100), defaults to 30%
 */
export const calculateTotalHours = (
    planType: PlanType | string,
    addons: { name: string }[],
    customHours?: number,
    customBufferPercent?: number
): { rawHours: number; bufferedHours: number; breakdown: { technical: number; admin: number }; bufferPercent: number } => {

    // Base hours from plan
    let baseHours = customHours && customHours > 0
        ? customHours
        : getBaseHoursForPlan(planType);

    // Add hours from add-ons
    const addonHours = addons.reduce((total, addon) => {
        return total + getHoursForAddOn(addon.name);
    }, 0);

    const rawHours = baseHours + addonHours;

    // Use custom buffer or default 30%
    const bufferPercent = customBufferPercent !== undefined ? customBufferPercent : BUFFER_CONFIG.TOTAL * 100;
    const bufferMultiplier = bufferPercent / 100;

    // Split buffer: 2/3 technical, 1/3 admin
    const technicalBuffer = rawHours * (bufferMultiplier * 2 / 3);
    const adminBuffer = rawHours * (bufferMultiplier * 1 / 3);
    const bufferedHours = Math.ceil(rawHours * (1 + bufferMultiplier));

    return {
        rawHours,
        bufferedHours,
        breakdown: {
            technical: Math.ceil(technicalBuffer),
            admin: Math.ceil(adminBuffer),
        },
        bufferPercent
    };
};

/**
 * Calculate delivery date based on hours and daily dedication
 * Considers existing capacity blocks to find available slots
 */
export const calculateDeliveryDate = (
    totalHours: number,
    dailyDedication: number,
    startDate: Date,
    occupiedDates: Map<string, number> = new Map() // date string -> hours occupied
): Date => {
    let remainingHours = totalHours;
    const currentDate = new Date(startDate);

    // Safety limit to prevent infinite loops
    const maxIterations = 365;
    let iterations = 0;

    while (remainingHours > 0 && iterations < maxIterations) {
        const dayOfWeek = currentDate.getDay();

        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
            iterations++;
            continue;
        }

        // Check available hours for this day
        const dateKey = currentDate.toISOString().split('T')[0];
        const occupiedHours = occupiedDates.get(dateKey) || 0;
        const availableHours = Math.max(0, dailyDedication - occupiedHours);

        if (availableHours > 0) {
            remainingHours -= availableHours;
        }

        currentDate.setDate(currentDate.getDate() + 1);
        iterations++;
    }

    // Return the last working day (go back one since we advanced past it)
    currentDate.setDate(currentDate.getDate() - 1);
    return currentDate;
};

/**
 * Calculate days in admin buffer (for Smart Start logic)
 */
export const calculateAdminBufferDays = (
    totalHours: number,
    dailyDedication: number
): number => {
    const adminBufferHours = totalHours * BUFFER_CONFIG.ADMIN;
    return Math.ceil(adminBufferHours / dailyDedication);
};

/**
 * Check if client delay is within acceptable buffer
 */
export const isWithinAdminBuffer = (
    quotedDate: Date,
    confirmationDate: Date,
    totalHours: number,
    dailyDedication: number
): boolean => {
    const bufferDays = calculateAdminBufferDays(totalHours, dailyDedication);
    const delayMs = confirmationDate.getTime() - quotedDate.getTime();
    const delayDays = Math.ceil(delayMs / (1000 * 60 * 60 * 24));

    return delayDays <= bufferDays;
};

/**
 * Format hours for display
 */
export const formatHours = (hours: number): string => {
    if (hours < 1) {
        return `${Math.round(hours * 60)} min`;
    }
    return `${hours}h`;
};

/**
 * Calculate estimated working days
 */
export const calculateWorkingDays = (
    totalHours: number,
    dailyDedication: number
): number => {
    return Math.ceil(totalHours / dailyDedication);
};
