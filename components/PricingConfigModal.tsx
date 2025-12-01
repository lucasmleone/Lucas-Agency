import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, RefreshCw } from 'lucide-react';
import { usePricingConfig, PricingConfig } from '../hooks/usePricingConfig';

interface PricingConfigModalProps {
    onClose: () => void;
}

export const PricingConfigModal: React.FC<PricingConfigModalProps> = ({ onClose }) => {
    const { config, loading, error, updateConfig } = usePricingConfig();
    const [localConfig, setLocalConfig] = useState<PricingConfig | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (config) {
            setLocalConfig(config);
        }
    }, [config]);

    const handleSave = async () => {
        if (!localConfig) return;
        setSaving(true);
        const success = await updateConfig(localConfig);
        setSaving(false);
        if (success) {
            alert('Configuración de precios actualizada correctamente');
            onClose();
        } else {
            alert('Error al guardar la configuración');
        }
    };

    const handleChange = (key: string, value: string) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            [key]: Number(value) || 0
        });
    };

    if (loading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Cargando configuración...</div></div>;
    if (error) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-lg text-red-600">{error} <button onClick={onClose} className="ml-4 text-gray-600 underline">Cerrar</button></div></div>;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                        Configuración de Precios Base
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        Define los precios base predeterminados para cada tipo de plan. Estos valores se usarán al crear nuevos proyectos o cambiar planes.
                    </p>

                    <div className="space-y-4">
                        {localConfig && (() => {
                            // Only 3 plans now
                            const planOrder = [
                                'Landing Page',
                                'Web Corporativa',
                                'Personalizado'
                            ];

                            // Ensure all plans exist in config with defaults
                            const completeConfig = {
                                'Landing Page': 200,
                                'Web Corporativa': 350,
                                'Personalizado': 0,
                                ...localConfig
                            };

                            return planOrder.map((plan) => (
                                <div key={plan} className="flex items-center justify-between group">
                                    <label className="text-gray-700 font-medium w-1/3">{plan}</label>
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 font-bold">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={completeConfig[plan] || 0}
                                            onChange={(e) => handleChange(plan, e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 border-t flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? 'Guardando...' : 'Guardar Precios'}
                    </button>
                </div>
            </div>
        </div>
    );
};
