import React from 'react';
import { DataSource } from '../types';

interface InstrumentTypeSelectorProps {
    selectedType: 'crypto' | 'forex' | 'commodities' | 'indices';
    selectedProvider: DataSource;
    onTypeChange: (type: 'crypto' | 'forex' | 'commodities' | 'indices') => void;
    onProviderChange: (provider: DataSource) => void;
}

const InstrumentTypeSelector: React.FC<InstrumentTypeSelectorProps> = ({
    selectedType,
    selectedProvider,
    onTypeChange,
    onProviderChange
}) => {
    const getAvailableProviders = (type: 'crypto' | 'forex' | 'commodities' | 'indices'): DataSource[] => {
        switch (type) {
            case 'crypto':
                return ['binance', 'bingx'];
            case 'forex':
                return ['twelvedata', 'alphavantage', 'oanda'];
            case 'commodities':
                return ['twelvedata', 'alphavantage', 'oanda'];
            case 'indices':
                return ['twelvedata', 'alphavantage', 'oanda'];
            default:
                return ['binance'];
        }
    };

    const getProviderDisplayName = (provider: DataSource): string => {
        switch (provider) {
            case 'binance':
                return 'Binance';
            case 'bingx':
                return 'BingX';
            case 'twelvedata':
                return 'Twelve Data';
            case 'alphavantage':
                return 'Alpha Vantage';
            case 'oanda':
                return 'OANDA';
            default:
                return provider;
        }
    };

    const availableProviders = getAvailableProviders(selectedType);

    return (
        <div className="space-y-3">
            {/* Instrument Type Selector */}
            <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tipo de Instrumento
                </label>
                <div className="grid grid-cols-2 gap-1">
                    {(['crypto', 'forex', 'commodities', 'indices'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => onTypeChange(type)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${selectedType === type
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                                }`}
                        >
                            {type === 'crypto' && '🪙 Crypto'}
                            {type === 'forex' && '💱 Forex'}
                            {type === 'commodities' && '🛢️ Materias P.'}
                            {type === 'indices' && '📈 Índices'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Provider Selector */}
            <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                    Proveedor de Datos
                </label>
                <select
                    value={selectedProvider}
                    onChange={(e) => onProviderChange(e.target.value as DataSource)}
                    className="w-full px-2 py-1 text-xs bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                    {availableProviders.map((provider) => (
                        <option key={provider} value={provider}>
                            {getProviderDisplayName(provider)}
                            {provider === 'alphavantage' && ' (25/día)'}
                            {provider === 'twelvedata' && ' (800/día)'}
                            {provider === 'oanda' && ' (Pro)'}
                        </option>
                    ))}
                </select>
            </div>

            {/* Provider Info */}
            <div className="text-xs text-slate-400">
                {selectedProvider === 'alphavantage' && (
                    <p>📝 Alpha Vantage: Gratuito hasta 25 consultas/día</p>
                )}
                {selectedProvider === 'twelvedata' && (
                    <p>📝 Twelve Data: Gratuito hasta 800 consultas/día</p>
                )}
                {selectedProvider === 'oanda' && (
                    <p>📝 OANDA: Requiere cuenta de trading</p>
                )}
                {(selectedProvider === 'binance' || selectedProvider === 'bingx') && (
                    <p>📝 {getProviderDisplayName(selectedProvider)}: Datos en tiempo real gratis</p>
                )}
            </div>
        </div>
    );
};

export default InstrumentTypeSelector;
