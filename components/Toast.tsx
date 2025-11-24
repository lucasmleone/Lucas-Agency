import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
    onCancel: () => void;
}

/**
 * Toast/Notification Component
 * Reemplaza window.alert y window.confirm con un sistema más confiable
 */
export function Toast({ message, type, onConfirm, onCancel }: ToastProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
                {/* Icon */}
                <div className="flex items-center justify-center mb-4">
                    {type === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
                    {type === 'error' && <AlertCircle className="h-12 w-12 text-red-500" />}
                    {type === 'confirm' && <AlertCircle className="h-12 w-12 text-orange-500" />}
                </div>

                {/* Message */}
                <p className="text-center text-gray-800 text-lg mb-6">{message}</p>

                {/* Buttons */}
                <div className={`flex gap-3 ${type === 'confirm' ? 'justify-center' : 'justify-end'}`}>
                    {type === 'confirm' ? (
                        <>
                            <button
                                onClick={onCancel}
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                            >
                                Eliminar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onCancel}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                        >
                            Cerrar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
