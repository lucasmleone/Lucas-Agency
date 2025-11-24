import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (import.meta.env.VITE_API_URL || '/api');

export interface PricingConfig {
    "Single Page": number;
    "Multipage": number;
    "E-commerce": number;
    "Personalizado": number;
    [key: string]: number;
}

export const usePricingConfig = () => {
    const [config, setConfig] = useState<PricingConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = async () => {
        try {
            const response = await axios.get(`${API_URL}/config/pricing`, { withCredentials: true });
            setConfig(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching pricing config:', err);
            setError('Failed to load pricing configuration');
            setLoading(false);
        }
    };

    const updateConfig = async (newConfig: PricingConfig) => {
        try {
            await axios.post(`${API_URL}/config/pricing`, newConfig, { withCredentials: true });
            setConfig(newConfig);
            return true;
        } catch (err) {
            console.error('Error updating pricing config:', err);
            return false;
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return { config, loading, error, updateConfig, refreshConfig: fetchConfig };
};
