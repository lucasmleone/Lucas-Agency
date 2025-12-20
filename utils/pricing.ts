import { PlanType } from '../types';

/**
 * Get the base price for a given plan type
 */
export const getBasePriceForPlan = (plan: PlanType, config?: Record<string, number>): number => {
    if (config && config[plan] !== undefined) {
        return config[plan];
    }

    switch (plan) {
        case PlanType.LANDING:
            return 200;
        case PlanType.CORPORATE:
            return 350;
        case PlanType.CUSTOM:
            return 0;
        // Legacy Plans Support
        case 'Multipage' as any:
            return 600;
        case 'E-commerce' as any:
            return 900;
        case 'Single Page' as any:
            return 300;
        default:
            return 0;
    }
};

/**
 * Get the display name for a plan including its price
 */
export const getPlanDisplayName = (plan: PlanType, config?: Record<string, number>): string => {
    const price = getBasePriceForPlan(plan, config);
    if (price === 0) return plan;
    return `${plan} ($${price})`;
};

/**
 * Calculate the final price after discounts
 * @param basePrice - The base price for the plan
 * @param customPrice - Custom price override (can be 0 for free projects)
 * @param isCustomPriceActive - Whether custom price should be used (handles $0 case)
 * @param discount - Discount amount
 * @param discountType - Type of discount (percentage or fixed)
 */
export const calculateFinalPrice = (
    basePrice: number,
    customPrice: number | undefined,
    isCustomPriceActive: boolean,
    discount?: number,
    discountType?: 'percentage' | 'fixed'
): number => {
    // Use custom price if explicitly active, otherwise use base price
    const startingPrice = isCustomPriceActive && customPrice !== undefined ? customPrice : basePrice;

    if (!discount || discount <= 0) {
        return startingPrice;
    }

    let finalPrice = startingPrice;

    if (discountType === 'percentage') {
        finalPrice = startingPrice * (1 - discount / 100);
    } else {
        finalPrice = startingPrice - discount;
    }

    return Math.max(0, Math.round(finalPrice * 100) / 100);
};

/**
 * Calculate the total price including add-ons and applying discounts
 * This is the main function to use for final price calculations across the app
 */
export const calculateTotalWithAddOns = (
    basePrice: number,
    addOnsTotal: number,
    customPrice: number | undefined,
    isCustomPriceActive: boolean,
    discount?: number,
    discountType?: 'percentage' | 'fixed'
): number => {
    // If custom price is explicitly active, use it as override (ignores base + addons)
    // Otherwise, start with base price + add-ons
    const subtotal = basePrice + addOnsTotal;
    const startingPrice = isCustomPriceActive && customPrice !== undefined ? customPrice : subtotal;

    // Apply discount to the starting price
    if (!discount || discount <= 0) {
        return Math.round(startingPrice * 100) / 100;
    }

    let finalPrice = startingPrice;

    if (discountType === 'percentage') {
        finalPrice = startingPrice * (1 - discount / 100);
    } else {
        finalPrice = startingPrice - discount;
    }

    return Math.max(0, Math.round(finalPrice * 100) / 100);
};

/**
 * Calculate savings amount
 */
export const calculateSavings = (
    basePrice: number,
    finalPrice: number,
    customPrice?: number
): number => {
    const startingPrice = customPrice && customPrice > 0 ? customPrice : basePrice;
    return Math.max(0, startingPrice - finalPrice);
};

/**
 * Get the effective price to use (custom or base)
 */
export const getEffectivePrice = (basePrice: number, customPrice?: number): number => {
    return customPrice && customPrice > 0 ? customPrice : basePrice;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
};
