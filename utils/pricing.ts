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
 */
export const calculateFinalPrice = (
    basePrice: number,
    customPrice?: number,
    discount?: number,
    discountType?: 'percentage' | 'fixed'
): number => {
    const startingPrice = customPrice && customPrice > 0 ? customPrice : basePrice;

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
    customPrice?: number,
    discount?: number,
    discountType?: 'percentage' | 'fixed'
): number => {
    // If custom price is set and greater than 0, use it as override (ignores base + addons)
    // Otherwise, start with base price + add-ons
    const subtotal = basePrice + addOnsTotal;
    const startingPrice = customPrice && customPrice > 0 ? customPrice : subtotal;

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
