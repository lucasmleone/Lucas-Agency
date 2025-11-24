import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const ProposalAccepted: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [clientName, setClientName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Extract project ID from URL path
    const pathParts = window.location.pathname.split('/');
    const projectId = pathParts[pathParts.length - 1];

    useEffect(() => {
        const acceptProposal = async () => {
            if (!projectId) {
                setStatus('error');
                setErrorMessage('No se proporcionó un ID de proyecto válido');
                return;
            }

            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                const response = await fetch(`${apiUrl}/public/accept-proposal`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ projectId }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setStatus('success');
                    setClientName(data.clientName || 'Cliente');
                } else {
                    setStatus('error');
                    setErrorMessage(data.error || 'No se pudo procesar la aceptación');
                }
            } catch (error) {
                setStatus('error');
                setErrorMessage('Error de conexión con el servidor');
            }
        };

        acceptProposal();
    }, [projectId]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-gray-800">Procesando tu confirmación...</h2>
                        <p className="text-gray-500 mt-2">Por favor espera un momento.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Presupuesto Aceptado!</h1>
                        <p className="text-gray-600 mb-6">
                            Gracias <strong>{clientName}</strong>. Hemos registrado tu confirmación correctamente.
                            <br /><br />
                            El equipo de desarrollo ha sido notificado y comenzará con la siguiente etapa (Recopilación de Información) a la brevedad.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500">
                            Puedes cerrar esta ventana.
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace Inválido o Expirado</h1>
                        <p className="text-gray-600 mb-6">
                            No pudimos procesar tu confirmación. Es posible que el enlace ya haya sido utilizado o no sea válido.
                        </p>
                        <p className="text-sm text-gray-500">
                            Por favor contacta directamente con la agencia si crees que esto es un error.
                        </p>
                    </div>
                )}
            </div>
            <div className="mt-8 text-center text-gray-400 text-xs">
                &copy; {new Date().getFullYear()} AgencyFlow System
            </div>
        </div>
    );
};
