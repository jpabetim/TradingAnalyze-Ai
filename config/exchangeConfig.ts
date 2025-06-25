// Exchange configuration with multiple CORS proxy fallbacks
export interface CorsProxy {
    name: string;
    url: string;
    parseResponse: (response: any) => any;
}

export const CORS_PROXIES: CorsProxy[] = [
    {
        name: 'thingproxy.freeboard.io',
        url: 'https://thingproxy.freeboard.io/fetch/',
        parseResponse: (response) => response // Direct response
    },
    {
        name: 'cors-proxy.htmldriven.com',
        url: 'https://cors-proxy.htmldriven.com/?url=',
        parseResponse: (response) => response // Direct response
    },
    {
        name: 'allorigins.win',
        url: 'https://api.allorigins.win/get?url=',
        parseResponse: (response) => {
            if (response.contents) {
                return JSON.parse(response.contents);
            }
            return response;
        }
    },
    {
        name: 'corsproxy.io',
        url: 'https://corsproxy.io/?',
        parseResponse: (response) => response // Direct response
    }
];

export const WEBSOCKET_CONFIG = {
    maxReconnectAttempts: 5,
    reconnectDelay: 3000, // 3 seconds
    pingInterval: 30000, // 30 seconds
    connectionTimeout: 10000 // 10 seconds
};

export const API_CONFIG = {
    requestTimeout: 15000, // 15 seconds
    maxRetries: 3,
    retryDelay: 1000 // 1 second between retries
};
