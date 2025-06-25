// Servicios simplificados para proveedores de datos de Forex, Índices y Materias Primas

import { DataSource } from '../types';
import {
    ALPHA_VANTAGE_CONFIG,
    TWELVE_DATA_CONFIG,
    formatSymbolForProvider
} from '../config/forexConfig';
import { fetchWithProxy } from '../utils/networkUtils';

export interface ForexCandle {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface ForexTickerData {
    symbol: string;
    price: number;
    changePercent?: number;
    volume?: number;
    provider: DataSource;
    timestamp?: number;
}

export interface ForexProviderService {
    getHistoricalData(symbol: string, interval: string, limit: number): Promise<ForexCandle[]>;
    getRealtimeData?(symbol: string): Promise<ForexTickerData>;
    subscribe?(symbol: string, interval: string, onData: (data: ForexCandle) => void): (() => void) | null;
    formatSymbol(symbol: string): string;
    name: string;
    type: DataSource;
}

// Alpha Vantage Service Implementation
class AlphaVantageService implements ForexProviderService {
    name = 'Alpha Vantage';
    type: DataSource = 'alphavantage';
    private config = ALPHA_VANTAGE_CONFIG;
    private apiKey: string | null = null;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || localStorage.getItem('alphavantage_api_key') || null;
    }

    setApiKey(apiKey: string) {
        this.apiKey = apiKey;
        localStorage.setItem('alphavantage_api_key', apiKey);
    }

    formatSymbol(symbol: string): string {
        return formatSymbolForProvider(symbol, this.config);
    }

    private mapIntervalToAlphaVantage(interval: string): { interval: string; functionType: string } {
        switch (interval) {
            case '1m': return { interval: '1min', functionType: 'FX_INTRADAY' };
            case '5m': return { interval: '5min', functionType: 'FX_INTRADAY' };
            case '15m': return { interval: '15min', functionType: 'FX_INTRADAY' };
            case '30m': return { interval: '30min', functionType: 'FX_INTRADAY' };
            case '1h': return { interval: '60min', functionType: 'FX_INTRADAY' };
            case '1d': return { interval: 'daily', functionType: 'FX_DAILY' };
            case '1w': return { interval: 'weekly', functionType: 'FX_WEEKLY' };
            case '1M': return { interval: 'monthly', functionType: 'FX_MONTHLY' };
            default: return { interval: 'daily', functionType: 'FX_DAILY' };
        }
    }

    async getHistoricalData(symbol: string, interval: string, limit: number): Promise<ForexCandle[]> {
        if (!this.apiKey) {
            throw new Error('Alpha Vantage API key is required');
        }

        const formattedSymbol = this.formatSymbol(symbol);
        const { interval: alphaInterval, functionType } = this.mapIntervalToAlphaVantage(interval);

        let url = `${this.config.baseUrl}?function=${functionType}&from_symbol=${formattedSymbol.slice(0, 3)}&to_symbol=${formattedSymbol.slice(3)}&apikey=${this.apiKey}`;

        if (functionType === 'FX_INTRADAY') {
            url += `&interval=${alphaInterval}&outputsize=full`;
        }

        try {
            const response = await fetchWithProxy({ url });
            const data = await response.json();

            if (data['Error Message']) {
                throw new Error(`Alpha Vantage Error: ${data['Error Message']}`);
            }

            if (data['Note']) {
                throw new Error('Alpha Vantage API rate limit reached');
            }

            // Parse the response based on function type
            let timeSeriesKey = '';
            if (functionType === 'FX_INTRADAY') {
                timeSeriesKey = `Time Series FX (${alphaInterval})`;
            } else if (functionType === 'FX_DAILY') {
                timeSeriesKey = 'Time Series FX (Daily)';
            } else if (functionType === 'FX_WEEKLY') {
                timeSeriesKey = 'Time Series FX (Weekly)';
            } else if (functionType === 'FX_MONTHLY') {
                timeSeriesKey = 'Time Series FX (Monthly)';
            }

            const timeSeries = data[timeSeriesKey];
            if (!timeSeries) {
                throw new Error('No time series data found in Alpha Vantage response');
            }

            const candles: ForexCandle[] = [];
            const entries = Object.entries(timeSeries).slice(0, limit);

            for (const [timeStr, values] of entries) {
                const time = new Date(timeStr).getTime() / 1000;
                const candleData = values as any;

                candles.push({
                    time,
                    open: parseFloat(candleData['1. open']),
                    high: parseFloat(candleData['2. high']),
                    low: parseFloat(candleData['3. low']),
                    close: parseFloat(candleData['4. close']),
                });
            }

            return candles.reverse(); // Alpha Vantage returns newest first, we want oldest first
        } catch (error) {
            console.error('Alpha Vantage API error:', error);
            throw error;
        }
    }

    async getRealtimeData(symbol: string): Promise<ForexTickerData> {
        if (!this.apiKey) {
            throw new Error('Alpha Vantage API key is required');
        }

        const formattedSymbol = this.formatSymbol(symbol);
        const url = `${this.config.baseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${formattedSymbol.slice(0, 3)}&to_currency=${formattedSymbol.slice(3)}&apikey=${this.apiKey}`;

        try {
            const response = await fetchWithProxy({ url });
            const data = await response.json();

            const exchangeRate = data['Realtime Currency Exchange Rate'];
            if (!exchangeRate) {
                throw new Error('No exchange rate data found');
            }

            return {
                symbol,
                price: parseFloat(exchangeRate['5. Exchange Rate']),
                provider: this.type,
                timestamp: new Date().getTime() / 1000
            };
        } catch (error) {
            console.error('Alpha Vantage realtime data error:', error);
            throw error;
        }
    }
}

// Twelve Data Service Implementation
class TwelveDataService implements ForexProviderService {
    name = 'Twelve Data';
    type: DataSource = 'twelvedata';
    private config = TWELVE_DATA_CONFIG;
    private apiKey: string | null = null;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || localStorage.getItem('twelvedata_api_key') || null;
    }

    setApiKey(apiKey: string) {
        this.apiKey = apiKey;
        localStorage.setItem('twelvedata_api_key', apiKey);
    }

    formatSymbol(symbol: string): string {
        return formatSymbolForProvider(symbol, this.config);
    }

    async getHistoricalData(symbol: string, interval: string, limit: number): Promise<ForexCandle[]> {
        const formattedSymbol = this.formatSymbol(symbol);
        let url = `${this.config.baseUrl}/time_series?symbol=${formattedSymbol}&interval=${interval}&outputsize=${limit}`;

        if (this.apiKey) {
            url += `&apikey=${this.apiKey}`;
        }

        try {
            const response = await fetchWithProxy({ url });
            const data = await response.json();

            if (data.status === 'error') {
                throw new Error(`Twelve Data Error: ${data.message}`);
            }

            if (!data.values || !Array.isArray(data.values)) {
                throw new Error('No time series data found in Twelve Data response');
            }

            const candles: ForexCandle[] = data.values.map((item: any) => ({
                time: new Date(item.datetime).getTime() / 1000,
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: item.volume ? parseFloat(item.volume) : undefined
            }));

            return candles.reverse(); // Twelve Data returns newest first
        } catch (error) {
            console.error('Twelve Data API error:', error);
            throw error;
        }
    }

    async getRealtimeData(symbol: string): Promise<ForexTickerData> {
        const formattedSymbol = this.formatSymbol(symbol);
        let url = `${this.config.baseUrl}/price?symbol=${formattedSymbol}`;

        if (this.apiKey) {
            url += `&apikey=${this.apiKey}`;
        }

        try {
            const response = await fetchWithProxy({ url });
            const data = await response.json();

            if (data.status === 'error') {
                throw new Error(`Twelve Data Error: ${data.message}`);
            }

            return {
                symbol,
                price: parseFloat(data.price),
                provider: this.type,
                timestamp: new Date().getTime() / 1000
            };
        } catch (error) {
            console.error('Twelve Data realtime data error:', error);
            throw error;
        }
    }
}

// Factory function to create the appropriate service
export function createForexProviderService(
    provider: DataSource,
    apiKey?: string,
    accountId?: string
): ForexProviderService {
    switch (provider) {
        case 'alphavantage':
            return new AlphaVantageService(apiKey);
        case 'twelvedata':
            return new TwelveDataService(apiKey);
        default:
            throw new Error(`Unsupported forex provider: ${provider}`);
    }
}

// Helper function to check if a provider is a forex provider
export function isForexProvider(provider: DataSource): boolean {
    return ['alphavantage', 'twelvedata'].includes(provider);
}

// Function to get supported instruments by category
export function getSupportedInstruments(
    provider: DataSource,
    category: 'forex' | 'indices' | 'commodities'
): string[] {
    switch (provider) {
        case 'alphavantage':
            return ALPHA_VANTAGE_CONFIG.supportedInstruments[category] || [];
        case 'twelvedata':
            return TWELVE_DATA_CONFIG.supportedInstruments[category] || [];
        default:
            return [];
    }
}
