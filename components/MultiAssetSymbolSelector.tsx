import React, { useState, useEffect } from 'react';
import { DataSource } from '../types';
import { POPULAR_SYMBOLS } from '../constants';
import { getSupportedInstruments } from '../services/forexProviders';

interface SymbolSelectorProps {
    symbol: string;
    dataSource: DataSource;
    instrumentType: 'crypto' | 'forex' | 'commodities' | 'indices';
    onSymbolChange: (symbol: string) => void;
    onInstrumentTypeChange: (type: 'crypto' | 'forex' | 'commodities' | 'indices') => void;
    onDataSourceChange: (source: DataSource) => void;
}

interface SymbolCategory {
    name: string;
    symbols: string[];
}

// Hook para manejar favoritos por exchange
const useFavorites = (dataSource: DataSource, instrumentType: string) => {
    const storageKey = `favorites_${dataSource}_${instrumentType}`;

    const [favorites, setFavorites] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(favorites));
    }, [favorites, storageKey]);

    const addFavorite = (symbol: string) => {
        setFavorites(prev => prev.includes(symbol) ? prev : [...prev, symbol]);
    };

    const removeFavorite = (symbol: string) => {
        setFavorites(prev => prev.filter(s => s !== symbol));
    };

    const isFavorite = (symbol: string) => {
        return favorites.includes(symbol);
    };

    return { favorites, addFavorite, removeFavorite, isFavorite };
};

const SymbolSelector: React.FC<SymbolSelectorProps> = ({
    symbol,
    dataSource,
    instrumentType,
    onSymbolChange,
    onInstrumentTypeChange,
    onDataSourceChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Hook para manejar favoritos
    const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites(dataSource, instrumentType);

    // Get available symbols based on instrument type and data source
    const getAvailableSymbols = (): SymbolCategory[] => {
        const categories: SymbolCategory[] = [];

        // Agregar categoría de favoritos si hay favoritos
        if (favorites.length > 0) {
            categories.push({ name: '⭐ Favoritos', symbols: favorites });
        }

        switch (instrumentType) {
            case 'crypto':
                categories.push(
                    { name: 'Popular', symbols: POPULAR_SYMBOLS.crypto[dataSource as keyof typeof POPULAR_SYMBOLS.crypto] || [] },
                    { name: 'Major', symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'LINKUSDT'] },
                    { name: 'Altcoins', symbols: ['MATICUSDT', 'AVAXUSDT', 'UNIUSDT', 'LTCUSDT', 'BCHUSDT', 'TRXUSDT', 'EOSUSDT', 'XLMUSDT'] },
                    { name: 'DeFi', symbols: ['AAVEUSDT', 'MKRUSDT', 'COMPUSDT', 'SUSHIUSDT', 'YFIUSDT', 'SNXUSDT', 'CRVUSDT', 'BALUSDT'] }
                );
                break;
            case 'forex':
                const forexSymbols = getSupportedInstruments(dataSource, 'forex');
                categories.push(
                    {
                        name: 'Majors', symbols: forexSymbols.filter(s =>
                            ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD'].includes(s.replace('/', ''))
                        )
                    },
                    {
                        name: 'Minors', symbols: forexSymbols.filter(s =>
                            !['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD'].includes(s.replace('/', ''))
                        )
                    }
                );
                break;
            case 'indices':
                const indicesSymbols = getSupportedInstruments(dataSource, 'indices');
                categories.push(
                    {
                        name: 'US Indices', symbols: indicesSymbols.filter(s =>
                            ['SPX', 'DJI', 'IXIC', 'RUT', 'VIX'].includes(s)
                        )
                    },
                    {
                        name: 'European', symbols: indicesSymbols.filter(s =>
                            ['UKX', 'DAX', 'CAC', 'SMI', 'IBEX'].includes(s)
                        )
                    },
                    {
                        name: 'Asian', symbols: indicesSymbols.filter(s =>
                            ['N225', 'HSI', 'SHCOMP', 'SENSEX', 'KOSPI'].includes(s)
                        )
                    }
                );
                break;
            case 'commodities':
                const commoditiesSymbols = getSupportedInstruments(dataSource, 'commodities');
                categories.push(
                    {
                        name: 'Metales', symbols: commoditiesSymbols.filter(s =>
                            s.includes('XAU') || s.includes('XAG') || s.includes('XPT') || s.includes('XPD')
                        )
                    },
                    {
                        name: 'Energía', symbols: commoditiesSymbols.filter(s =>
                            s.includes('OIL') || s.includes('GAS') || s.includes('CL') || s.includes('BZ') || s.includes('NG')
                        )
                    },
                    {
                        name: 'Agricultura', symbols: commoditiesSymbols.filter(s =>
                            ['WHEAT', 'CORN', 'SOYBEAN', 'SUGAR', 'COFFEE', 'ZW', 'ZC', 'ZS', 'SB', 'KC'].some(ag => s.includes(ag))
                        )
                    }
                );
                break;
            default:
                break;
        }

        return categories;
    };

    // Get available data sources for current instrument type - Show all exchanges always
    const getAvailableDataSources = (): DataSource[] => {
        // Mostrar todos los exchanges/providers siempre, independientemente del tipo de instrumento
        return ['binance', 'bingx', 'alphavantage', 'twelvedata', 'yfinance'];
    };

    const availableSymbols = getAvailableSymbols();
    const availableDataSources = getAvailableDataSources();

    // Filter symbols based on search term
    const filteredSymbols = availableSymbols.map(category => ({
        ...category,
        symbols: category.symbols.filter(s =>
            s.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.symbols.length > 0);

    const getInstrumentIcon = (type: string) => {
        switch (type) {
            case 'crypto': return '🪙';
            case 'forex': return '💱';
            case 'commodities': return '🛢️';
            case 'indices': return '📈';
            default: return '📊';
        }
    };

    const getDataSourceDisplayName = (source: DataSource): string => {
        switch (source) {
            case 'binance': return 'Binance';
            case 'bingx': return 'BingX';
            case 'alphavantage': return 'Alpha Vantage';
            case 'twelvedata': return 'Twelve Data';
            case 'yfinance': return 'Yahoo Finance';
            default: return source;
        }
    };

    const handleSymbolSelect = (selectedSymbol: string) => {
        onSymbolChange(selectedSymbol);
        setIsOpen(false);
        setSearchTerm('');
    };

    const toggleFavorite = (selectedSymbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFavorite(selectedSymbol)) {
            removeFavorite(selectedSymbol);
        } else {
            addFavorite(selectedSymbol);
        }
    };

    return (
        <div className="space-y-3">
            {/* Instrument Type Selector */}
            <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tipo de Activo
                </label>
                <div className="grid grid-cols-2 gap-1">
                    {(['crypto', 'forex', 'commodities', 'indices'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => onInstrumentTypeChange(type)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${instrumentType === type
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                                }`}
                        >
                            {getInstrumentIcon(type)} {type === 'crypto' ? 'Crypto' :
                                type === 'forex' ? 'Forex' :
                                    type === 'commodities' ? 'Materias P.' : 'Índices'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Source Selector */}
            <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                    Proveedor de Datos
                </label>
                <select
                    value={dataSource}
                    onChange={(e) => onDataSourceChange(e.target.value as DataSource)}
                    className="w-full px-2 py-1 text-xs bg-slate-600 border border-slate-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                    {availableDataSources.map((source) => (
                        <option key={source} value={source}>
                            {getDataSourceDisplayName(source)}
                            {source === 'alphavantage' && ' (25/día)'}
                            {source === 'twelvedata' && ' (800/día)'}
                        </option>
                    ))}
                </select>
            </div>

            {/* Symbol Selector */}
            <div className="relative">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                    Símbolo
                    {favorites.length > 0 && (
                        <span className="ml-2 text-xs text-yellow-400">
                            ⭐ {favorites.length} favorito{favorites.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </label>
                <div
                    className="w-full px-2 py-1 text-xs bg-slate-600 border border-slate-500 rounded text-white cursor-pointer hover:bg-slate-500 flex justify-between items-center"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="flex items-center gap-1">
                        {isFavorite(symbol) && <span className="text-yellow-400">⭐</span>}
                        {symbol || 'Seleccionar símbolo'}
                    </span>
                    <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </div>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-500 rounded shadow-lg z-10 max-h-60 overflow-hidden">
                        {/* Search Box */}
                        <div className="p-2 border-b border-slate-500">
                            <input
                                type="text"
                                placeholder="Buscar símbolo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-2 py-1 text-xs bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                autoFocus
                            />
                        </div>

                        {/* Symbol List */}
                        <div className="overflow-y-auto max-h-40">
                            {filteredSymbols.length === 0 ? (
                                <div className="p-2 text-xs text-slate-400 text-center">
                                    No se encontraron símbolos
                                </div>
                            ) : (
                                filteredSymbols.map((category) => (
                                    <div key={category.name}>
                                        <div className="px-2 py-1 text-xs font-medium text-slate-300 bg-slate-600 border-b border-slate-500">
                                            {category.name}
                                        </div>
                                        {category.symbols.map((symbolOption) => (
                                            <div
                                                key={symbolOption}
                                                className="px-2 py-1 text-xs text-white hover:bg-slate-600 cursor-pointer flex justify-between items-center group"
                                                onClick={() => handleSymbolSelect(symbolOption)}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {isFavorite(symbolOption) && <span className="text-yellow-400">⭐</span>}
                                                    {symbolOption}
                                                </span>
                                                <button
                                                    onClick={(e) => toggleFavorite(symbolOption, e)}
                                                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${isFavorite(symbolOption)
                                                            ? 'text-yellow-400 hover:text-yellow-300'
                                                            : 'text-slate-400 hover:text-yellow-400'
                                                        }`}
                                                    title={isFavorite(symbolOption) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                                >
                                                    {isFavorite(symbolOption) ? '⭐' : '☆'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Current selection info */}
            {symbol && (
                <div className="text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                        {getInstrumentIcon(instrumentType)} {instrumentType.toUpperCase()} • {getDataSourceDisplayName(dataSource)}
                        {isFavorite(symbol) && <span className="text-yellow-400 ml-1">⭐</span>}
                    </span>
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-5"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default SymbolSelector;
