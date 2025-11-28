import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface PortalLoginProps {
    clientName: string;
    projectName: string;
    onSubmit: (pin: string) => Promise<void>;
}

export const PortalLogin: React.FC<PortalLoginProps> = ({ clientName, projectName, onSubmit }) => {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 4) return;

        setLoading(true);
        setError('');
        try {
            await onSubmit(pin);
        } catch (err) {
            setError('PIN incorrecto');
            setPin('');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-blue-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Seguro</h2>
                    <p className="text-gray-500 mb-8">
                        Portal de Cliente para <span className="font-semibold text-gray-900">{clientName}</span>
                        <br />
                        <span className="text-sm text-gray-400">{projectName}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ingrese su PIN de 4 dígitos</label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="w-full text-center text-3xl font-mono tracking-[1em] border-b-2 border-gray-200 focus:border-blue-600 outline-none py-2 transition-colors"
                                placeholder="••••"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={pin.length !== 4 || loading}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2
                                ${pin.length === 4 && !loading ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30' : 'bg-gray-300 cursor-not-allowed'}
                            `}
                        >
                            {loading ? 'Verificando...' : (
                                <>
                                    Ingresar al Portal <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">Protegido por Lucas Agency Security</p>
                </div>
            </div>
        </div>
    );
};
