import { CORS_PROXIES, API_CONFIG } from '../config/exchangeConfig';

export interface FetchWithProxyOptions {
    url: string;
    timeout?: number;
    maxRetries?: number;
}

export async function fetchWithProxy({
    url,
    timeout = API_CONFIG.requestTimeout,
    maxRetries = API_CONFIG.maxRetries
}: FetchWithProxyOptions): Promise<any> {
    let lastError: Error | null = null;

    // For BingX, skip direct fetch since we know it has CORS issues
    const shouldTryDirect = !url.includes('open-api.bingx.com');

    if (shouldTryDirect) {
        // First, try direct fetch (for endpoints that don't need CORS proxy)
        try {
            console.log(`Attempting direct fetch: ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Direct fetch successful');
            return data;

        } catch (error) {
            console.warn('Direct fetch failed:', error);
            lastError = error as Error;
        }
    }

    // If direct fetch fails, try each CORS proxy
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        const proxy = CORS_PROXIES[i];
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const proxyUrl = proxy.url + encodeURIComponent(url);
                console.log(`Attempting proxy fetch (${i + 1}/${CORS_PROXIES.length}, retry ${retryCount + 1}/${maxRetries}): ${proxy.name}`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(proxyUrl, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    cache: 'no-cache'
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const rawData = await response.json();
                const parsedData = proxy.parseResponse(rawData);

                console.log(`Proxy fetch successful via ${proxy.name}`);
                return parsedData;

            } catch (error) {
                console.warn(`Proxy ${proxy.name} failed (attempt ${retryCount + 1}):`, error);
                lastError = error as Error;
                retryCount++;

                if (retryCount < maxRetries) {
                    const delay = API_CONFIG.retryDelay * retryCount; // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    }

    // If all proxies failed
    throw new Error(`All proxy attempts failed. Last error: ${lastError?.message}`);
}

export function createWebSocketWithReconnect(
    url: string,
    options: {
        onOpen?: () => void;
        onMessage?: (event: MessageEvent) => void;
        onError?: (event: Event) => void;
        onClose?: (event: CloseEvent) => void;
        maxReconnectAttempts?: number;
        reconnectDelay?: number;
    } = {}
): {
    ws: WebSocket | null;
    connect: () => void;
    disconnect: () => void;
    getStatus: () => 'connecting' | 'connected' | 'disconnected' | 'error';
} {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    let status: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
    let shouldReconnect = true;

    const {
        onOpen,
        onMessage,
        onError,
        onClose,
        maxReconnectAttempts = 5,
        reconnectDelay = 3000
    } = options;

    const connect = () => {
        if (ws?.readyState === WebSocket.CONNECTING || ws?.readyState === WebSocket.OPEN) {
            return;
        }

        if (reconnectAttempts >= maxReconnectAttempts) {
            console.error(`Max WebSocket reconnection attempts (${maxReconnectAttempts}) reached for ${url}`);
            status = 'error';
            return;
        }

        try {
            status = 'connecting';
            ws = new WebSocket(url);

            ws.onopen = (event) => {
                console.log(`WebSocket connected to ${url}`);
                status = 'connected';
                reconnectAttempts = 0;
                if (reconnectTimeout) {
                    clearTimeout(reconnectTimeout);
                    reconnectTimeout = null;
                }
                onOpen?.();
            };

            ws.onmessage = onMessage || (() => { });

            ws.onerror = (event) => {
                console.error(`WebSocket error for ${url}:`, event);
                status = 'error';
                reconnectAttempts++;
                onError?.(event);
            };

            ws.onclose = (event) => {
                console.log(`WebSocket disconnected from ${url}. Code: ${event.code}, Reason: "${event.reason}"`);
                status = 'disconnected';

                onClose?.(event);

                // Schedule reconnection if not a manual close and within retry limits
                if (shouldReconnect && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
                    console.log(`Scheduling WebSocket reconnection in ${reconnectDelay}ms... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
                    reconnectTimeout = setTimeout(() => {
                        reconnectAttempts++;
                        connect();
                    }, reconnectDelay);
                } else if (reconnectAttempts >= maxReconnectAttempts) {
                    console.error(`Max WebSocket reconnection attempts reached for ${url}`);
                    status = 'error';
                }
            };

        } catch (error) {
            console.error(`Failed to create WebSocket connection to ${url}:`, error);
            status = 'error';
        }
    };

    const disconnect = () => {
        shouldReconnect = false;
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        if (ws) {
            ws.close(1000, 'Manual disconnect');
        }
        status = 'disconnected';
    };

    const getStatus = () => status;

    return { ws, connect, disconnect, getStatus };
}
