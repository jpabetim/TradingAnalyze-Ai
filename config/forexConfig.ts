// Configuración para proveedores de Forex, Índices y Materias Primas

export interface ForexProviderConfig {
    name: string;
    type: 'forex';
    baseUrl: string;
    apiKey?: string;
    supportedInstruments: {
        forex: string[];
        indices: string[];
        commodities: string[];
    };
    wsEndpoint?: string;
    rateLimit: number; // requests per minute
}

// Alpha Vantage - Gratuito con límites
export const ALPHA_VANTAGE_CONFIG: ForexProviderConfig = {
    name: 'Alpha Vantage',
    type: 'forex',
    baseUrl: 'https://www.alphavantage.co/query',
    rateLimit: 25, // 25 requests per day (free tier)
    supportedInstruments: {
        forex: [
            'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
            'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'CADJPY', 'CHFJPY',
            'EURCHF', 'EURNZD', 'EURAUD', 'EURSEK', 'EURNOK', 'EURCAD'
        ],
        indices: [
            'SPX', 'DJI', 'IXIC', 'RUT', 'VIX', // US indices
            'UKX', 'DAX', 'CAC', 'SMI', 'IBEX', // European indices
            'N225', 'HSI', 'SHCOMP', 'SENSEX', 'KOSPI' // Asian indices
        ],
        commodities: [
            'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', // Precious metals
            'USOIL', 'UKOIL', 'NATGAS', // Energy
            'WHEAT', 'CORN', 'SOYBEAN', 'SUGAR', 'COFFEE' // Agriculture
        ]
    }
};

// Twelve Data - Alternativa con más instrumentos
export const TWELVE_DATA_CONFIG: ForexProviderConfig = {
    name: 'Twelve Data',
    type: 'forex',
    baseUrl: 'https://api.twelvedata.com',
    rateLimit: 800, // 800 requests per day (free tier)
    wsEndpoint: 'wss://ws.twelvedata.com/v1/quotes/price',
    supportedInstruments: {
        forex: [
            // Trial symbols disponibles
            'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'NZD/USD',
            'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'CAD/JPY', 'CHF/JPY',
            'EUR/CHF', 'EUR/NZD', 'EUR/AUD', 'EUR/SEK', 'EUR/NOK', 'EUR/CAD',
            // Additional test symbols
            'USD/CNY', 'USD/SGD', 'USD/HKD', 'USD/MXN', 'USD/ZAR'
        ],
        indices: [
            // Trial symbols para índices  
            'SPX', 'DJI', 'IXIC', 'RUT', 'VIX',
            'UKX', 'DAX', 'CAC', 'SMI', 'IBEX',
            'N225', 'HSI', 'SHCOMP', 'SENSEX', 'KOSPI',
            // Test symbols
            'FTSE', 'ASX', 'TSX'
        ],
        commodities: [
            // Trial symbols para commodities
            'XAU/USD', 'XAG/USD', 'XPT/USD', 'XPD/USD',
            'CL', 'BZ', 'NG', // Oil and Gas
            'ZW', 'ZC', 'ZS', 'SB', 'KC', // Agriculture
            // Test symbols
            'GC', 'SI', 'HG', 'PA'
        ]
    }
};

// OANDA API - Muy completo pero requiere cuenta
export const OANDA_CONFIG: ForexProviderConfig = {
    name: 'OANDA',
    type: 'forex',
    baseUrl: 'https://api-fxtrade.oanda.com/v3',
    rateLimit: 120, // Depends on account type
    wsEndpoint: 'wss://stream-fxtrade.oanda.com/v3',
    supportedInstruments: {
        forex: [
            'EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'USD_CAD', 'AUD_USD', 'NZD_USD',
            'EUR_GBP', 'EUR_JPY', 'GBP_JPY', 'AUD_JPY', 'CAD_JPY', 'CHF_JPY',
            'EUR_CHF', 'EUR_NZD', 'EUR_AUD', 'EUR_SEK', 'EUR_NOK', 'EUR_CAD',
            'GBP_CHF', 'GBP_AUD', 'GBP_CAD', 'GBP_NZD', 'AUD_CHF', 'AUD_CAD',
            'AUD_NZD', 'CAD_CHF', 'CHF_NOK', 'CHF_SEK', 'NOK_SEK', 'USD_NOK',
            'USD_SEK', 'USD_DKK', 'USD_PLN', 'USD_CZK', 'USD_HUF', 'USD_TRY'
        ],
        indices: [
            'US30_USD', 'SPX500_USD', 'NAS100_USD', 'US2000_USD',
            'UK100_GBP', 'DE30_EUR', 'FR40_EUR', 'EU50_EUR',
            'JP225_USD', 'AU200_AUD', 'HK33_HKD'
        ],
        commodities: [
            'XAU_USD', 'XAG_USD', 'XPT_USD', 'XPD_USD',
            'BCO_USD', 'WTICO_USD', 'NATGAS_USD',
            'WHEAT_USD', 'CORN_USD', 'SOYBN_USD', 'SUGAR_USD'
        ]
    }
};

// Yahoo Finance - Gratuito para la mayoría de instrumentos
export const YFINANCE_CONFIG: ForexProviderConfig = {
    name: 'Yahoo Finance',
    type: 'forex',
    baseUrl: 'https://query1.finance.yahoo.com/v7/finance/chart',
    rateLimit: 120, // 2 requests per second approximately
    supportedInstruments: {
        forex: [
            'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'USDCAD=X',
            'AUDUSD=X', 'NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X',
            'AUDJPY=X', 'CADJPY=X', 'CHFJPY=X', 'EURCHF=X', 'EURNZD=X',
            'EURAUD=X', 'GBPCAD=X', 'GBPAUD=X', 'GBPNZD=X', 'AUDCAD=X'
        ],
        indices: [
            '^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX', // US indices
            '^FTSE', '^GDAXI', '^FCHI', '^IBEX', '^N225', // International
            '^HSI', '^STI', '^AXJO', '^BVSP', '^MXX', // Asia-Pacific
            '^GSPTSE', '^MERV', '^TA125', '^TWII' // Americas & Others
        ],
        commodities: [
            'GC=F', 'SI=F', 'PL=F', 'PA=F', // Precious metals futures
            'CL=F', 'BZ=F', 'NG=F', 'HO=F', 'RB=F', // Energy futures
            'ZC=F', 'ZS=F', 'ZW=F', 'KE=F', 'CC=F', // Agriculture futures
            'HG=F', 'ALI=F', 'ZN=F', 'ZB=F' // Industrial metals & bonds
        ]
    }
};

// Función para formatear símbolos según el proveedor
export const formatSymbolForProvider = (symbol: string, provider: ForexProviderConfig): string => {
    switch (provider.name) {
        case 'Alpha Vantage':
            return symbol.replace('/', '').toUpperCase();
        case 'Twelve Data':
            return symbol.toUpperCase();
        default:
            return symbol;
    }
};

// Función para obtener instrumentos por categoría
export const getInstrumentsByCategory = (provider: ForexProviderConfig, category: 'forex' | 'indices' | 'commodities'): string[] => {
    return provider.supportedInstruments[category] || [];
};

// Lista consolidada de todos los instrumentos disponibles
export const ALL_FOREX_INSTRUMENTS = [
    ...ALPHA_VANTAGE_CONFIG.supportedInstruments.forex,
    ...TWELVE_DATA_CONFIG.supportedInstruments.forex
].filter((value, index, self) => self.indexOf(value) === index);

export const ALL_INDICES_INSTRUMENTS = [
    ...ALPHA_VANTAGE_CONFIG.supportedInstruments.indices,
    ...TWELVE_DATA_CONFIG.supportedInstruments.indices
].filter((value, index, self) => self.indexOf(value) === index);

export const ALL_COMMODITIES_INSTRUMENTS = [
    ...ALPHA_VANTAGE_CONFIG.supportedInstruments.commodities,
    ...TWELVE_DATA_CONFIG.supportedInstruments.commodities
].filter((value, index, self) => self.indexOf(value) === index);
