// Servicios simplificados para proveedores de datos de Forex, Índices y Materias Primas

import { DataSource } from '../types';
import {
    ALPHA_VANTAGE_CONFIG,
    TWELVE_DATA_CONFIG,
    YFINANCE_CONFIG,
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
        this.apiKey = apiKey || 
                     (typeof window !== 'undefined' && (import.meta as any).env?.VITE_ALPHA_VANTAGE_API_KEY) ||
                     localStorage.getItem('alphavantage_api_key') || 
                     null;
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
        this.apiKey = apiKey || 
                     (typeof window !== 'undefined' && (import.meta as any).env?.VITE_TWELVE_DATA_API_KEY) ||
                     localStorage.getItem('twelvedata_api_key') || 
                     null;
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
        
        // Use demo API key for trial symbols, otherwise use provided API key
        const apiKey = this.apiKey || 'demo';
        
        let url = `${this.config.baseUrl}/time_series?symbol=${formattedSymbol}&interval=${interval}&outputsize=${limit}&apikey=${apiKey}`;

        try {
            const response = await fetchWithProxy({ url });
            const data = await response.json();

            if (data.status === 'error') {
                console.warn(`Twelve Data Error: ${data.message}, trying with demo key...`);
                // If error with user key, try with demo key
                if (this.apiKey && this.apiKey !== 'demo') {
                    const demoUrl = `${this.config.baseUrl}/time_series?symbol=${formattedSymbol}&interval=${interval}&outputsize=${limit}&apikey=demo`;
                    const demoResponse = await fetchWithProxy({ url: demoUrl });
                    const demoData = await demoResponse.json();
                    
                    if (demoData.status === 'error') {
                        throw new Error(`Twelve Data Error: ${demoData.message}`);
                    }
                    
                    return this.parseTwelveDataResponse(demoData);
                }
                throw new Error(`Twelve Data Error: ${data.message}`);
            }

            return this.parseTwelveDataResponse(data);
        } catch (error) {
            console.error('Twelve Data API error:', error);
            throw error;
        }
    }

    private parseTwelveDataResponse(data: any): ForexCandle[] {
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
    }

    async getRealtimeData(symbol: string): Promise<ForexTickerData> {
        const formattedSymbol = this.formatSymbol(symbol);
        const apiKey = this.apiKey || 'demo';
        
        let url = `${this.config.baseUrl}/price?symbol=${formattedSymbol}&apikey=${apiKey}`;

        try {
            const response = await fetchWithProxy({ url });
            const data = await response.json();

            if (data.status === 'error') {
                // Try with demo key if user key fails
                if (this.apiKey && this.apiKey !== 'demo') {
                    const demoUrl = `${this.config.baseUrl}/price?symbol=${formattedSymbol}&apikey=demo`;
                    const demoResponse = await fetchWithProxy({ url: demoUrl });
                    const demoData = await demoResponse.json();
                    
                    if (demoData.status === 'error') {
                        throw new Error(`Twelve Data Error: ${demoData.message}`);
                    }
                    
                    return {
                        symbol,
                        price: parseFloat(demoData.price),
                        provider: this.type,
                        timestamp: new Date().getTime() / 1000
                    };
                }
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

// Yahoo Finance Service Implementation
class YahooFinanceService implements ForexProviderService {
    name = 'Yahoo Finance';
    type: DataSource = 'yfinance';
    private config = YFINANCE_CONFIG;

    formatSymbol(symbol: string): string {
        // Yahoo Finance symbol format
        if (symbol.includes('/')) {
            // For forex pairs like EUR/USD -> EURUSD=X
            const base = symbol.split('/')[0];
            const quote = symbol.split('/')[1];
            return `${base}${quote}=X`;
        }
        // For other symbols, use as-is or add common suffixes
        if (symbol.includes('=X') || symbol.includes('=F') || symbol.startsWith('^')) {
            return symbol;
        }
        // For stocks, use as-is
        return symbol;
    }

    async getHistoricalData(symbol: string, interval: string, limit: number): Promise<ForexCandle[]> {
        const formattedSymbol = this.formatSymbol(symbol);

        // Convert interval to Yahoo Finance format
        const yInterval = this.convertInterval(interval);

        // Calculate the period more simply - just use recent data
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - (this.calculateSecondsFromInterval(interval) * limit * 2); // Get 2x data to ensure we have enough

        const url = `${this.config.baseUrl}/${formattedSymbol}?period1=${startTime}&period2=${endTime}&interval=${yInterval}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`Yahoo Finance API error: ${response.status}, trying alternative API...`);
                // Try alternative Yahoo Finance endpoint
                const altUrl = `https://query2.finance.yahoo.com/v7/finance/chart/${formattedSymbol}?period1=${startTime}&period2=${endTime}&interval=${yInterval}`;
                const altResponse = await fetch(altUrl);
                
                if (!altResponse.ok) {
                    throw new Error(`Yahoo Finance API error: ${altResponse.status}`);
                }
                
                const altData = await altResponse.json();
                return this.parseYahooResponse(altData, limit);
            }

            const data = await response.json();
            return this.parseYahooResponse(data, limit);
        } catch (error) {
            console.error('Yahoo Finance API error:', error);
            throw new Error(`Failed to fetch data from Yahoo Finance: ${error}`);
        }
    }

    private parseYahooResponse(data: any, limit: number): ForexCandle[] {
        if (!data.chart?.result?.[0]?.timestamp) {
            throw new Error('Invalid response from Yahoo Finance API');
        }

        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];

        const candles: ForexCandle[] = timestamps
            .map((timestamp: number, index: number) => ({
                time: timestamp,
                open: quote.open[index] || 0,
                high: quote.high[index] || 0,
                low: quote.low[index] || 0,
                close: quote.close[index] || 0,
                volume: quote.volume?.[index] || 0,
            }))
            .filter((candle: ForexCandle) =>
                candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0
            )
            .slice(-limit); // Get the last 'limit' candles

        return candles;
    }

    private calculateSecondsFromInterval(interval: string): number {
        switch (interval) {
            case '1m': return 60;
            case '5m': return 300;
            case '15m': return 900;
            case '30m': return 1800;
            case '1h': return 3600;
            case '4h': return 14400;
            case '1d': return 86400;
            case '1w': return 604800;
            case '1M': return 2592000; // Approximate
            default: return 86400;
        }
    }

    async getRealtimeData(symbol: string): Promise<ForexTickerData> {
        const formattedSymbol = this.formatSymbol(symbol);
        const url = `${this.config.baseUrl}/${formattedSymbol}?interval=1m&period1=${Math.floor(Date.now() / 1000) - 300}&period2=${Math.floor(Date.now() / 1000)}`;

        try {
            const response = await fetchWithProxy({ url });
            const data = await response.json();

            if (!data.chart?.result?.[0]) {
                throw new Error('Invalid response from Yahoo Finance API');
            }

            const result = data.chart.result[0];
            const quote = result.indicators.quote[0];
            const lastIndex = quote.close.length - 1;

            return {
                symbol: formattedSymbol,
                price: quote.close[lastIndex],
                volume: quote.volume?.[lastIndex],
                provider: 'yfinance',
                timestamp: result.timestamp[lastIndex]
            };
        } catch (error) {
            console.error('Yahoo Finance realtime API error:', error);
            throw new Error(`Failed to fetch realtime data from Yahoo Finance: ${error}`);
        }
    }

    private convertInterval(interval: string): string {
        const intervalMap: { [key: string]: string } = {
            '1m': '1m',
            '3m': '2m',
            '5m': '5m',
            '15m': '15m',
            '30m': '30m',
            '1h': '1h',
            '2h': '1h',
            '4h': '1h',
            '6h': '1h',
            '8h': '1h',
            '12h': '1h',
            '1d': '1d',
            '3d': '1d',
            '1w': '1wk',
            '1M': '1mo'
        };
        return intervalMap[interval] || '1d';
    }
}

// Factory function to create the appropriate service
export function createForexProviderService(
    provider: DataSource,
    apiKey?: string
): ForexProviderService {
    switch (provider) {
        case 'alphavantage':
            return new AlphaVantageService(apiKey);
        case 'twelvedata':
            return new TwelveDataService(apiKey);
        case 'yfinance':
            return new YahooFinanceService();
        default:
            throw new Error(`Unsupported forex provider: ${provider}`);
    }
}

// Helper function to check if a provider is a forex provider
export function isForexProvider(provider: DataSource): boolean {
    return ['alphavantage', 'twelvedata', 'yfinance'].includes(provider);
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
        case 'yfinance':
            return YFINANCE_CONFIG.supportedInstruments[category] || [];
        default:
            return [];
    }
}
