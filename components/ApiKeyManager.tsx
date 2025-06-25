import React, { useState, useEffect } from 'react';
import { DataSource } from '../types';

interface ApiKeyManagerProps {
    provider: DataSource;
    onApiKeyChange: (apiKey: string, accountId?: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
    provider,
    onApiKeyChange,
    isOpen,
    onClose
}) => {
    const [apiKey, setApiKey] = useState('');
    const [accountId, setAccountId] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load saved API key from localStorage
            const savedKey = localStorage.getItem(`${provider}_api_key`) || '';
            const savedAccountId = localStorage.getItem(`${provider}_account_id`) || '';
            setApiKey(savedKey);
            setAccountId(savedAccountId);
        }
    }, [isOpen, provider]);

    const getProviderInfo = (provider: DataSource) => {
        switch (provider) {
            case 'alphavantage':
                return {
                    name: 'Alpha Vantage',
                    description: 'Obtén tu API key gratuita en alphavantage.co',
                    freeLimit: '25 requests/día',
                    needsAccountId: false,
                    website: 'https://www.alphavantage.co/support/#api-key'
                };
            case 'twelvedata':
                return {
                    name: 'Twelve Data',
                    description: 'Registra una cuenta gratuita en twelvedata.com',
                    freeLimit: '800 requests/día',
                    needsAccountId: false,
                    website: 'https://twelvedata.com/docs#getting-started'
                };
            case 'oanda':
                return {
                    name: 'OANDA',
                    description: 'Requiere cuenta demo o real de OANDA',
                    freeLimit: 'Según tipo de cuenta',
                    needsAccountId: true,
                    website: 'https://developer.oanda.com/'
                };
            default:
                return {
                    name: provider,
                    description: 'Configuración de API',
                    freeLimit: '',
                    needsAccountId: false,
                    website: ''
                };
        }
    };

    const handleSave = () => {
        if (!apiKey.trim()) {
            alert('Por favor, ingresa una API key válida');
            return;
        }

        // Save to localStorage
        localStorage.setItem(`${provider}_api_key`, apiKey);
        if (accountId.trim()) {
            localStorage.setItem(`${provider}_account_id`, accountId);
        }

        // Call the callback
        onApiKeyChange(apiKey, accountId || undefined);
        onClose();
    };

    const handleClear = () => {
        localStorage.removeItem(`${provider}_api_key`);
        localStorage.removeItem(`${provider}_account_id`);
        setApiKey('');
        setAccountId('');
        onApiKeyChange('');
    };

    const providerInfo = getProviderInfo(provider);

    if (!isOpen) return null;

    // Only show for forex providers
    if (!['alphavantage', 'twelvedata', 'oanda'].includes(provider)) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">
                        Configurar {providerInfo.name}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-xl"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-slate-300">
                        <p>{providerInfo.description}</p>
                        {providerInfo.freeLimit && (
                            <p className="text-yellow-400 mt-1">
                                Límite gratuito: {providerInfo.freeLimit}
                            </p>
                        )}
                    </div>

                    {providerInfo.website && (
                        <a
                            href={providerInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                            Obtener API Key →
                        </a>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Ingresa tu API key"
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2 top-2 text-slate-400 hover:text-white"
                            >
                                {showKey ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {providerInfo.needsAccountId && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Account ID (opcional para OANDA)
                            </label>
                            <input
                                type="text"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                placeholder="Tu Account ID de OANDA"
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                        >
                            Guardar
                        </button>
                        <button
                            onClick={handleClear}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>

                    {apiKey && (
                        <div className="text-xs text-green-400 text-center">
                            ✓ API Key configurada
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApiKeyManager;
