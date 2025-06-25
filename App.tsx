import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IChartApi } from 'lightweight-charts';
import ControlsPanel from './components/ControlsPanel';
import RealTimeTradingChart, { RSIPanel } from './components/RealTimeTradingChartSimple';
import AnalysisPanel from './components/AnalysisPanel';
import ApiKeyMessage from './components/ApiKeyMessage';
import ApiKeyManager from './components/ApiKeyManager';
import DisplaySettingsDialog from './components/DisplaySettingsDialog';

import { GeminiAnalysisResult, DataSource, MovingAverageConfig } from './types';
import { analyzeChartWithGemini, ExtendedGeminiRequestPayload, sendChatMessageWithContext, ChatWithContextPayload } from './services/geminiService';
import { generateHistoricalDataSummary, generateMovingAveragesSummary } from './utils/chartContext';
import { DEFAULT_SYMBOL, DEFAULT_TIMEFRAME, DEFAULT_DATA_SOURCE, CHAT_SYSTEM_PROMPT_TEMPLATE, GEMINI_MODEL_NAME, QUICK_SELECT_TIMEFRAMES } from './constants';
import { GoogleGenAI, Chat } from "@google/genai";

// Helper for debouncing
// function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
//   let timeoutId: ReturnType<typeof setTimeout> | null = null;
//   return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
//     timeoutId = setTimeout(() => {
//       func.apply(this, args);
//     }, delay);
//   };
// }

interface LatestChartInfo {
  price: number | null;
  volume?: number | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

type Theme = 'dark' | 'light';
export type AnalysisPanelMode = 'initial' | 'analysis' | 'chat';

const initialMAs: MovingAverageConfig[] = [
  { id: 'ma1', type: 'EMA', period: 12, color: '#34D399', visible: true },
  { id: 'ma2', type: 'EMA', period: 20, color: '#F472B6', visible: true },
  { id: 'ma3', type: 'MA', period: 50, color: '#CBD5E1', visible: true },
  { id: 'ma4', type: 'MA', period: 200, color: '#FF0000', visible: true },
];

const INITIAL_DARK_CHART_PANE_BACKGROUND_COLOR = '#18191B';
const INITIAL_LIGHT_CHART_PANE_BACKGROUND_COLOR = '#FFFFFF';
const INITIAL_VOLUME_PANE_HEIGHT = 30;
const INITIAL_W_SIGNAL_COLOR = '#243EA8';
const INITIAL_W_SIGNAL_OPACITY = 70;
const INITIAL_SHOW_W_SIGNALS = true;

const getLocalStorageItem = <T,>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      try {
        return JSON.parse(storedValue) as T;
      } catch (e) {
        // If JSON.parse fails, try to return the raw string if it matches the default type
        if (typeof defaultValue === 'string' && typeof storedValue === 'string') {
          return storedValue as T;
        }
        console.error(`Error parsing localStorage item ${key}:`, e);
        return defaultValue;
      }
    }
  }
  return defaultValue;
};

const getConsistentSymbolForDataSource = (symbol: string, ds: DataSource): string => {
  let consistentSymbol = symbol.toUpperCase();
  if (ds === 'bingx') {
    if (consistentSymbol === 'BTCUSDT') return 'BTC-USDT';
    if (consistentSymbol === 'ETHUSDT') return 'ETH-USDT';
    if (consistentSymbol === 'SOLUSDT') return 'SOL-USDT';
  } else if (ds === 'binance') {
    if (consistentSymbol === 'BTC-USDT') return 'BTCUSDT';
    if (consistentSymbol === 'ETH-USDT') return 'ETHUSDT';
    if (consistentSymbol === 'SOL-USDT') return 'SOLUSDT';
  }
  return consistentSymbol;
};


const App: React.FC = () => {
  const initialRawSymbol = getLocalStorageItem('traderoad_actualSymbol', DEFAULT_SYMBOL);
  const initialDataSource = getLocalStorageItem('traderoad_dataSource', DEFAULT_DATA_SOURCE);
  const consistentInitialSymbol = getConsistentSymbolForDataSource(initialRawSymbol, initialDataSource);

  const [dataSource, setDataSource] = useState<DataSource>(initialDataSource);
  const [actualSymbol, setActualSymbol] = useState<string>(consistentInitialSymbol);
  const [symbolInput, setSymbolInput] = useState<string>(consistentInitialSymbol);
  const [timeframe, setTimeframe] = useState<string>(() => getLocalStorageItem('traderoad_timeframe', DEFAULT_TIMEFRAME));
  const [candleLimit, setCandleLimit] = useState<number>(() => getLocalStorageItem('traderoad_candleLimit', 500));
  const [theme, setTheme] = useState<Theme>(() => getLocalStorageItem('traderoad_theme', 'dark'));
  const [movingAverages, setMovingAverages] = useState<MovingAverageConfig[]>(() => getLocalStorageItem('traderoad_movingAverages', initialMAs));

  // Estado para zona horaria - sincronizado entre gráfico principal y RSI
  const [timezoneIndex, setTimezoneIndex] = useState<number>(() => getLocalStorageItem('traderoad_timezoneIndex', 0));
  const timezones = [
    { name: 'UTC+2', zone: 'Europe/Madrid' },
    { name: 'Nueva York', zone: 'America/New_York' },
    { name: 'Londres', zone: 'Europe/London' },
    { name: 'Tokyo', zone: 'Asia/Tokyo' },
    { name: 'UTC', zone: 'UTC' }
  ];
  const currentTimezone = timezones[timezoneIndex];

  // Multi-asset trading state
  const [instrumentType, setInstrumentType] = useState<'crypto' | 'forex' | 'commodities' | 'indices'>(() =>
    getLocalStorageItem('traderoad_instrumentType', 'crypto')
  );
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [currentApiKeyProvider, setCurrentApiKeyProvider] = useState<DataSource>('alphavantage');

  const initialBgColorBasedOnTheme = theme === 'dark' ? INITIAL_DARK_CHART_PANE_BACKGROUND_COLOR : INITIAL_LIGHT_CHART_PANE_BACKGROUND_COLOR;
  const [chartPaneBackgroundColor, setChartPaneBackgroundColor] = useState<string>(() =>
    getLocalStorageItem('traderoad_chartPaneBackgroundColor', initialBgColorBasedOnTheme)
  );

  const [volumePaneHeight, setVolumePaneHeight] = useState<number>(() => getLocalStorageItem('traderoad_volumePaneHeight', INITIAL_VOLUME_PANE_HEIGHT));
  const [showAiAnalysisDrawings, setShowAiAnalysisDrawings] = useState<boolean>(() => getLocalStorageItem('traderoad_showAiAnalysisDrawings', true));
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(() => getLocalStorageItem('traderoad_isPanelVisible', true));
  const [wSignalColor, setWSignalColor] = useState<string>(() => getLocalStorageItem('traderoad_wSignalColor', INITIAL_W_SIGNAL_COLOR));
  const [wSignalOpacity, setWSignalOpacity] = useState<number>(() => getLocalStorageItem('traderoad_wSignalOpacity', INITIAL_W_SIGNAL_OPACITY));
  const [showWSignals, setShowWSignals] = useState<boolean>(() => getLocalStorageItem('traderoad_showWSignals', INITIAL_SHOW_W_SIGNALS));

  // Nuevos estados para controles de indicadores
  const [showMovingAverages, setShowMovingAverages] = useState<boolean>(() => getLocalStorageItem('traderoad_showMovingAverages', true));
  const [maOpacity, setMaOpacity] = useState<number>(() => getLocalStorageItem('traderoad_maOpacity', 1.0));
  const [showMaLabelsOnPriceScale, setShowMaLabelsOnPriceScale] = useState<boolean>(() => getLocalStorageItem('traderoad_showMaLabelsOnPriceScale', false)); // Etiquetas de medias móviles desactivadas por defecto

  const [analysisOpacity, setAnalysisOpacity] = useState<number>(() => getLocalStorageItem('traderoad_analysisOpacity', 0.6));

  const [showMaxMinLabels, setShowMaxMinLabels] = useState<boolean>(() => getLocalStorageItem('traderoad_showMaxMinLabels', false));
  const [maxMinOpacity, setMaxMinOpacity] = useState<number>(() => getLocalStorageItem('traderoad_maxMinOpacity', 0.6));
  const [maxMinColor, setMaxMinColor] = useState<string>(() => getLocalStorageItem('traderoad_maxMinColor', '#888888'));

  // Estado para el camino probable del precio
  const [showPricePath, setShowPricePath] = useState<boolean>(() => getLocalStorageItem('traderoad_showPricePath', true));

  // Estados para RSI
  const [showRSI, setShowRSI] = useState<boolean>(() => getLocalStorageItem('traderoad_showRSI', true)); // RSI activo por defecto
  const [rsiPeriod, setRsiPeriod] = useState<number>(() => getLocalStorageItem('traderoad_rsiPeriod', 14));
  const [rsiHeight, setRsiHeight] = useState<number>(() => getLocalStorageItem('traderoad_rsiHeight', 100));
  const [rsiOverboughtLevel, setRsiOverboughtLevel] = useState<number>(() => getLocalStorageItem('traderoad_rsiOverboughtLevel', 70));
  const [rsiOversoldLevel, setRsiOversoldLevel] = useState<number>(() => getLocalStorageItem('traderoad_rsiOversoldLevel', 30));
  const [rsiLevel80, setRsiLevel80] = useState<boolean>(() => getLocalStorageItem('traderoad_rsiLevel80', false));
  const [rsiLevel20, setRsiLevel20] = useState<boolean>(() => getLocalStorageItem('traderoad_rsiLevel20', false));
  const [rsiColor, setRsiColor] = useState<string>(() => getLocalStorageItem('traderoad_rsiColor', '#FFFFFF')); // Cambiado a blanco
  const [rsiOverboughtColor, setRsiOverboughtColor] = useState<string>(() => getLocalStorageItem('traderoad_rsiOverboughtColor', 'rgba(156, 163, 175, 0.8)')); // Cambiado a gris claro
  const [rsiOversoldColor, setRsiOversoldColor] = useState<string>(() => getLocalStorageItem('traderoad_rsiOversoldColor', 'rgba(156, 163, 175, 0.8)')); // Cambiado a gris claro
  const [rsiBackgroundColor, setRsiBackgroundColor] = useState<string>(() => getLocalStorageItem('traderoad_rsiBackgroundColor', 'transparent'));

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyPresent, setApiKeyPresent] = useState<boolean>(false);
  const [displaySettingsDialogOpen, setDisplaySettingsDialogOpen] = useState<boolean>(false);

  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [latestChartInfo, setLatestChartInfo] = useState<LatestChartInfo>({ price: null, volume: null });
  const [historicalChartData, setHistoricalChartData] = useState<any[]>([]); // Para almacenar datos históricos del gráfico
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const [analysisPanelMode, setAnalysisPanelMode] = useState<AnalysisPanelMode>('initial');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  // Estado para la referencia del gráfico principal (para sincronización con RSI)
  const [mainChartRef, setMainChartRef] = useState<React.RefObject<IChartApi | null> | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('traderoad_dataSource', JSON.stringify(dataSource));
      localStorage.setItem('traderoad_actualSymbol', JSON.stringify(actualSymbol));
      localStorage.setItem('traderoad_timeframe', JSON.stringify(timeframe));
      localStorage.setItem('traderoad_theme', JSON.stringify(theme));
      localStorage.setItem('traderoad_movingAverages', JSON.stringify(movingAverages));
      localStorage.setItem('traderoad_chartPaneBackgroundColor', JSON.stringify(chartPaneBackgroundColor));
      localStorage.setItem('traderoad_volumePaneHeight', JSON.stringify(volumePaneHeight));
      localStorage.setItem('traderoad_showAiAnalysisDrawings', JSON.stringify(showAiAnalysisDrawings));
      localStorage.setItem('traderoad_isPanelVisible', JSON.stringify(isPanelVisible));
      localStorage.setItem('traderoad_wSignalColor', JSON.stringify(wSignalColor));
      localStorage.setItem('traderoad_wSignalOpacity', JSON.stringify(wSignalOpacity));
      localStorage.setItem('traderoad_showWSignals', JSON.stringify(showWSignals));
      localStorage.setItem('traderoad_candleLimit', JSON.stringify(candleLimit));
      localStorage.setItem('traderoad_instrumentType', JSON.stringify(instrumentType));
      localStorage.setItem('traderoad_timezoneIndex', JSON.stringify(timezoneIndex)); // Guardar zona horaria

      // Nuevos items para controles de indicadores
      localStorage.setItem('traderoad_showMovingAverages', JSON.stringify(showMovingAverages));
      localStorage.setItem('traderoad_maOpacity', JSON.stringify(maOpacity));
      localStorage.setItem('traderoad_showMaLabelsOnPriceScale', JSON.stringify(showMaLabelsOnPriceScale));
      localStorage.setItem('traderoad_analysisOpacity', JSON.stringify(analysisOpacity));
      localStorage.setItem('traderoad_showMaxMinLabels', JSON.stringify(showMaxMinLabels));
      localStorage.setItem('traderoad_maxMinOpacity', JSON.stringify(maxMinOpacity));
      localStorage.setItem('traderoad_maxMinColor', JSON.stringify(maxMinColor));
      localStorage.setItem('traderoad_showPricePath', JSON.stringify(showPricePath));

      // RSI states
      localStorage.setItem('traderoad_showRSI', JSON.stringify(showRSI));
      localStorage.setItem('traderoad_rsiPeriod', JSON.stringify(rsiPeriod));
      localStorage.setItem('traderoad_rsiHeight', JSON.stringify(rsiHeight));
      localStorage.setItem('traderoad_rsiOverboughtLevel', JSON.stringify(rsiOverboughtLevel));
      localStorage.setItem('traderoad_rsiOversoldLevel', JSON.stringify(rsiOversoldLevel));
      localStorage.setItem('traderoad_rsiLevel80', JSON.stringify(rsiLevel80));
      localStorage.setItem('traderoad_rsiLevel20', JSON.stringify(rsiLevel20));
      localStorage.setItem('traderoad_rsiColor', JSON.stringify(rsiColor));
      localStorage.setItem('traderoad_rsiOverboughtColor', JSON.stringify(rsiOverboughtColor));
      localStorage.setItem('traderoad_rsiOversoldColor', JSON.stringify(rsiOversoldColor));
      localStorage.setItem('traderoad_rsiBackgroundColor', JSON.stringify(rsiBackgroundColor));
    }
  }, [
    dataSource, actualSymbol, timeframe, theme, movingAverages,
    chartPaneBackgroundColor, volumePaneHeight, showAiAnalysisDrawings, isPanelVisible,
    wSignalColor, wSignalOpacity, showWSignals, candleLimit, instrumentType,
    showMovingAverages, maOpacity, showMaLabelsOnPriceScale, analysisOpacity,
    showMaxMinLabels, maxMinOpacity, maxMinColor, showPricePath,
    showRSI, rsiPeriod, rsiHeight, rsiOverboughtLevel, rsiOversoldLevel, rsiLevel80, rsiLevel20,
    rsiColor, rsiOverboughtColor, rsiOversoldColor, rsiBackgroundColor
  ]);

  useEffect(() => {
    setIsMobile(typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent));
    let keyFromEnv: string | undefined = undefined;
    if (typeof window !== 'undefined' && window.process && window.process.env && typeof window.process.env.API_KEY === 'string') {
      keyFromEnv = window.process.env.API_KEY;
    }
    if (keyFromEnv && keyFromEnv !== "TU_CLAVE_API_DE_GEMINI_AQUI") {
      setApiKey(keyFromEnv);
      setApiKeyPresent(true);
    } else {
      setApiKey(null);
      setApiKeyPresent(false);
      console.warn("Gemini API Key (API_KEY) is not set or is the placeholder value. AI analysis will be disabled.");
    }
  }, []);

  // Manejador para cambio de zona horaria
  const handleTimezoneChange = useCallback(() => {
    setTimezoneIndex((prev) => (prev + 1) % timezones.length);
  }, [timezones.length]);

  const getChatSystemPrompt = useCallback(() => {
    return CHAT_SYSTEM_PROMPT_TEMPLATE
      .replace('{{SYMBOL}}', actualSymbol.includes('-') ? actualSymbol.replace('-', '/') : (actualSymbol.endsWith('USDT') ? actualSymbol.replace(/USDT$/, '/USDT') : actualSymbol))
      .replace('{{TIMEFRAME}}', timeframe.toUpperCase());
  }, [actualSymbol, timeframe]);

  const initializeChatSession = useCallback(() => {
    if (apiKey && !chatLoading) { // Prevent re-initialization if already loading/processing
      try {
        const ai = new GoogleGenAI({ apiKey });
        chatSessionRef.current = ai.chats.create({
          model: GEMINI_MODEL_NAME,
          config: { systemInstruction: getChatSystemPrompt() },
        });
        setChatError(null); // Clear previous errors on successful init
      } catch (e: any) {
        console.error("Failed to initialize chat session:", e);
        setChatError(`Falló la inicialización del chat IA: ${e.message}.`);
        chatSessionRef.current = null; // Ensure it's null on failure
      }
    }
  }, [apiKey, getChatSystemPrompt, chatLoading]);


  useEffect(() => {
    if (apiKeyPresent) { // Only attempt to initialize if API key is marked as present
      initializeChatSession();
    }
  }, [apiKeyPresent, initializeChatSession]);


  // const debouncedSetActualSymbol = useCallback(
  //   debounce((newSymbol: string) => {
  //     const consistentTypedSymbol = getConsistentSymbolForDataSource(newSymbol.trim(), dataSource);
  //     setActualSymbol(consistentTypedSymbol);
  //     if (consistentTypedSymbol !== newSymbol.trim()) {
  //       setSymbolInput(consistentTypedSymbol);
  //     }
  //   }, 750),
  //   [dataSource]
  // );

  // Unused for now - could be used by MultiAssetSymbolSelector
  // const handleSymbolInputChange = (newInputValue: string) => {
  //   setSymbolInput(newInputValue.toUpperCase());
  //   debouncedSetActualSymbol(newInputValue.toUpperCase());
  // };

  useEffect(() => {
    if (symbolInput !== actualSymbol) {
      setSymbolInput(actualSymbol);
    }
  }, [actualSymbol]);


  useEffect(() => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisPanelMode('initial'); // Reset to initial to avoid showing stale analysis for new symbol
  }, [actualSymbol, dataSource]);


  useEffect(() => {
    setLatestChartInfo({ price: null, volume: null });
  }, [actualSymbol, timeframe, dataSource]);

  useEffect(() => {
    const newThemeDefaultBgColor = theme === 'dark' ? INITIAL_DARK_CHART_PANE_BACKGROUND_COLOR : INITIAL_LIGHT_CHART_PANE_BACKGROUND_COLOR;
    const isCurrentBgThemeDefault =
      chartPaneBackgroundColor === INITIAL_DARK_CHART_PANE_BACKGROUND_COLOR ||
      chartPaneBackgroundColor === INITIAL_LIGHT_CHART_PANE_BACKGROUND_COLOR;

    if (isCurrentBgThemeDefault && chartPaneBackgroundColor !== newThemeDefaultBgColor) {
      setChartPaneBackgroundColor(newThemeDefaultBgColor);
    }
  }, [theme, chartPaneBackgroundColor]);

  const handleLatestChartInfoUpdate = useCallback((info: LatestChartInfo) => setLatestChartInfo(info), []);
  const handleChartLoadingStateChange = useCallback((chartLoading: boolean) => setIsChartLoading(chartLoading), []);

  const handleHistoricalDataUpdate = useCallback((data: any[]) => {
    setHistoricalChartData(data);
  }, []);

  const handleRequestAnalysis = useCallback(async () => {
    if (!apiKey) {
      setAnalysisError("Clave API no configurada. El análisis no puede proceder.");
      setAnalysisPanelMode('analysis');
      return;
    }
    if (isChartLoading || latestChartInfo.price === null || latestChartInfo.price === 0) {
      setAnalysisError("Datos del gráfico cargando o precio actual no disponible.");
      setAnalysisPanelMode('analysis');
      return;
    }

    // If switching TO analysis mode AND a result exists for the current context, just show it.
    if (analysisPanelMode !== 'analysis' && analysisResult) {
      setAnalysisPanelMode('analysis');
      setAnalysisLoading(false); // Ensure loading is off if we're just switching views
      setAnalysisError(null);
      return;
    }

    // Otherwise (already in analysis mode OR no result exists), fetch new analysis.
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null); // Clear previous result before fetching new one
    setAnalysisPanelMode('analysis'); // Ensure mode is set

    try {
      const displaySymbolForAI = actualSymbol.includes('-') ? actualSymbol.replace('-', '/') : (actualSymbol.endsWith('USDT') ? actualSymbol.replace(/USDT$/, '/USDT') : actualSymbol);
      const payload: ExtendedGeminiRequestPayload = {
        symbol: displaySymbolForAI, timeframe: timeframe.toUpperCase(), currentPrice: latestChartInfo.price,
        marketContextPrompt: "Context will be generated by getFullAnalysisPrompt",
        latestVolume: latestChartInfo.volume, apiKey: apiKey
      };
      const result = await analyzeChartWithGemini(payload);
      setAnalysisResult(result);
    } catch (err) {
      let userErrorMessage = (err instanceof Error) ? err.message : "Ocurrió un error desconocido.";
      setAnalysisError(`${userErrorMessage} --- Revisa la consola para más detalles.`);
    } finally {
      setAnalysisLoading(false);
    }
  }, [apiKey, actualSymbol, timeframe, latestChartInfo, isChartLoading, isMobile, analysisResult, analysisPanelMode]);

  const handleShowChat = () => {
    setAnalysisPanelMode('chat');
    setChatError(null);
    if (!apiKeyPresent) {
      setChatError("Clave API no configurada. El Chat IA no está disponible.");
    } else if (!chatSessionRef.current) {
      initializeChatSession(); // Attempt to initialize if not already done
    }
  };

  const handleSendMessageToChat = async (messageText: string) => {
    if (!messageText.trim() || chatLoading) return;

    if (!apiKey || !apiKeyPresent) {
      setChatError("Clave API no configurada. El Chat IA no está disponible.");
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: messageText.trim(),
      timestamp: Date.now(),
    };
    setChatMessages((prevMessages: ChatMessage[]) => [...prevMessages, userMessage]);
    setChatLoading(true);
    setChatError(null);

    try {
      // Construir el contexto del gráfico y análisis actual
      const chartContext = {
        symbol: actualSymbol.includes('-') ? actualSymbol.replace('-', '/') : (actualSymbol.endsWith('USDT') ? actualSymbol.replace(/USDT$/, '/USDT') : actualSymbol),
        timeframe: timeframe.toUpperCase(),
        currentPrice: latestChartInfo.price,
        currentVolume: latestChartInfo.volume ?? null,
        historicalDataSummary: generateHistoricalDataSummary(historicalChartData, timeframe),
        movingAveragesStatus: generateMovingAveragesSummary(movingAverages),
        analysisResult: analysisResult,
        visibleDrawings: {
          aiAnalysisDrawings: showAiAnalysisDrawings,
          wSignals: showWSignals,
          movingAverages: movingAverages.filter((ma: any) => ma.visible).map((ma: any) => `${ma.type}${ma.period}`)
        }
      };

      // Construir el historial de chat en formato Gemini
      const chatHistory = chatMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }] as [{ text: string }]
      }));

      const payload: ChatWithContextPayload = {
        apiKey,
        userMessage: messageText.trim(),
        chartContext,
        chatHistory
      };

      const stream = await sendChatMessageWithContext(payload);
      let currentAiMessageId = crypto.randomUUID();
      let accumulatedResponse = "";

      setChatMessages((prevMessages: ChatMessage[]) => [
        ...prevMessages,
        { id: currentAiMessageId, sender: 'ai', text: "🧠 TradeGuru está analizando el gráfico... ▋", timestamp: Date.now() },
      ]);

      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulatedResponse += value.text;
          setChatMessages((prevMessages: ChatMessage[]) =>
            prevMessages.map((msg) =>
              msg.id === currentAiMessageId ? { ...msg, text: accumulatedResponse + "▋" } : msg
            )
          );
        }
      } finally {
        reader.releaseLock();
      }

      setChatMessages((prevMessages: ChatMessage[]) =>
        prevMessages.map((msg) =>
          msg.id === currentAiMessageId ? { ...msg, text: accumulatedResponse } : msg
        )
      );
    } catch (e: any) {
      console.error("Error sending message to Context-Aware Chat:", e);
      const errorMessage = `Error en TradeGuru AI: ${e.message}`;
      setChatError(errorMessage);
      setChatMessages((prevMessages: ChatMessage[]) => [
        ...prevMessages,
        { id: crypto.randomUUID(), sender: 'ai', text: `❌ Error: ${e.message}`, timestamp: Date.now() },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChatHistory = () => {
    setChatMessages([]);
    setChatError(null);
    // Re-initialize chat session to clear AI's context as well
    if (apiKeyPresent) {
      initializeChatSession();
    }
  };


  // const handleDataSourceChange = (newDataSource: DataSource) => {
  //   setDataSource(newDataSource);
  //   const symbolToConvert = symbolInput || actualSymbol;
  //   const consistentNewSymbol = getConsistentSymbolForDataSource(symbolToConvert, newDataSource);
  //   setActualSymbol(consistentNewSymbol);
  //   setSymbolInput(consistentNewSymbol);
  // };

  // Multi-asset trading handlers
  const handleInstrumentTypeChange = (type: 'crypto' | 'forex' | 'commodities' | 'indices') => {
    setInstrumentType(type);

    // Reset symbol when changing instrument type
    const defaultSymbol = type === 'crypto' ? 'BTCUSDT' :
      type === 'forex' ? 'EURUSD' :
        type === 'commodities' ? 'XAUUSD' : 'SPX';
    setActualSymbol(defaultSymbol);
    setSymbolInput(defaultSymbol);
  };

  const handleMultiAssetSymbolChange = (symbol: string) => {
    setActualSymbol(symbol);
    setSymbolInput(symbol);
  };

  const handleMultiAssetDataSourceChange = (newDataSource: DataSource) => {
    setDataSource(newDataSource);

    // Limpiar el símbolo cuando cambie el exchange/provider
    setActualSymbol('');
    setSymbolInput('');

    // Check if API key is needed for the new provider
    if (['alphavantage', 'twelvedata', 'oanda'].includes(newDataSource)) {
      const savedKey = localStorage.getItem(`${newDataSource}_api_key`);
      if (!savedKey) {
        setCurrentApiKeyProvider(newDataSource);
        setShowApiKeyManager(true);
      }
    }
  };

  const handleApiKeyChange = (_apiKey: string, _accountId?: string) => {
    // This is handled by the ApiKeyManager component
    console.log(`API key updated for ${currentApiKeyProvider}`);
  };

  // Reset RSI default values for new version (one-time migration)
  useEffect(() => {
    const RSI_DEFAULTS_VERSION = 'v2.0';
    const currentVersion = localStorage.getItem('traderoad_rsi_defaults_version');

    if (currentVersion !== RSI_DEFAULTS_VERSION) {
      // Reset RSI colors to new defaults
      setRsiColor('#FFFFFF');
      setRsiOverboughtColor('rgba(156, 163, 175, 0.8)');
      setRsiOversoldColor('rgba(156, 163, 175, 0.8)');

      // Save new version to prevent future resets
      localStorage.setItem('traderoad_rsi_defaults_version', RSI_DEFAULTS_VERSION);

      console.log('🎨 RSI colors updated to new defaults');
    }
  }, []);

  // Efecto de migración para forzar nuevos valores por defecto
  useEffect(() => {
    const migrationKey = 'appDefaults_v3';
    const migrationApplied = localStorage.getItem(migrationKey);

    if (!migrationApplied) {
      console.log('🔧 Applying app defaults migration v3...');

      // Forzar los nuevos valores por defecto del RSI
      setRsiColor('#FFFFFF'); // Blanco
      setRsiOverboughtColor('rgba(156, 163, 175, 0.8)'); // Gris claro
      setRsiOversoldColor('rgba(156, 163, 175, 0.8)'); // Gris claro
      setShowRSI(true); // RSI activo por defecto

      // Nuevos valores por defecto de UI
      setVolumePaneHeight(30); // Volumen con altura 30px por defecto
      setShowMaLabelsOnPriceScale(false); // Etiquetas de medias móviles desactivadas

      // Marcar la migración como aplicada
      localStorage.setItem(migrationKey, 'true');
      console.log('✅ App defaults migration v3 completed');
    }
  }, []);

  return (
    <div className={`flex flex-col h-screen antialiased ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-gray-100 text-gray-900'}`}>
      {/* API Key Manager Modal */}
      <ApiKeyManager
        provider={currentApiKeyProvider}
        onApiKeyChange={handleApiKeyChange}
        isOpen={showApiKeyManager}
        onClose={() => setShowApiKeyManager(false)}
      />

      <header className={`p-2 sm:p-3 shadow-md flex justify-between items-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-white border-b border-gray-200'}`}>
        <h1 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`}>TradingRoad-Ai</h1>

        {/* Controles centrales - Temporalidad y Velas */}
        <div className="flex items-center gap-3">
          {/* Temporalidades */}
          <div className="flex items-center gap-2">
            <label className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Temporalidad:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className={`px-2 py-1 text-xs rounded border ${theme === 'dark'
                ? 'bg-slate-700 border-slate-600 text-white'
                : 'bg-white border-gray-300 text-black'
                }`}
            >
              {QUICK_SELECT_TIMEFRAMES.map(tf => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>

          {/* Separador */}
          <div className={`h-6 w-px ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></div>

          {/* Número de velas */}
          <div className="flex items-center gap-2">
            <label className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>Velas:</label>
            <select
              value={candleLimit}
              onChange={(e) => setCandleLimit(Number(e.target.value))}
              className={`px-2 py-1 text-xs rounded border ${theme === 'dark'
                ? 'bg-slate-700 border-slate-600 text-white'
                : 'bg-white border-gray-300 text-black'
                }`}
            >
              {[100, 200, 300, 500, 1000, 1500, 2000].map(limit => (
                <option key={limit} value={limit}>{limit}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsPanelVisible(!isPanelVisible)}
            aria-label={isPanelVisible ? 'Ocultar panel de controles' : 'Mostrar panel de controles'}
            className={`p-1.5 sm:p-2 rounded text-xs transition-colors ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            {isPanelVisible ? 'Ocultar' : 'Mostrar'}
          </button>

          <button
            onClick={() => setShowPricePath(!showPricePath)}
            title={showPricePath ? 'Ocultar Camino Probable' : 'Mostrar Camino Probable'}
            aria-label={showPricePath ? 'Ocultar Camino Probable del Precio' : 'Mostrar Camino Probable del Precio'}
            className={`p-1.5 sm:p-2 rounded text-xs transition-colors ${showPricePath
              ? (theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
              : (theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
              }`}
          >
            🛣️
          </button>

          <button
            onClick={() => setDisplaySettingsDialogOpen(true)}
            title="Configuración de Visualización"
            aria-label="Abrir Configuración de Visualización"
            className={`p-1.5 sm:p-2 rounded text-xs transition-colors ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
            aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
            className={`p-1.5 sm:p-2 rounded text-xs transition-colors ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 007.5 0z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <ApiKeyMessage apiKeyPresent={apiKeyPresent} />



      <main className="flex-grow flex flex-col md:flex-row p-2 sm:p-4 gap-2 sm:gap-4 overflow-y-auto">
        <div className={`w-full flex-1 flex flex-col gap-2 sm:gap-4 overflow-hidden order-1 ${isPanelVisible ? 'md:order-2' : 'md:order-1'}`}>
          {/* Chart principal */}
          <div className={`flex-grow min-h-[300px] sm:min-h-[400px] md:min-h-0 shadow-lg rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <RealTimeTradingChart
              dataSource={dataSource}
              symbol={actualSymbol}
              timeframe={timeframe}
              analysisResult={analysisResult}
              onLatestChartInfoUpdate={handleLatestChartInfoUpdate}
              onChartLoadingStateChange={handleChartLoadingStateChange}
              onHistoricalDataUpdate={handleHistoricalDataUpdate}
              movingAverages={movingAverages}
              theme={theme}
              chartPaneBackgroundColor={chartPaneBackgroundColor}
              volumePaneHeight={volumePaneHeight}
              showAiAnalysisDrawings={showAiAnalysisDrawings}
              candleLimit={candleLimit}
              showMovingAverages={showMovingAverages}
              maOpacity={maOpacity}
              analysisOpacity={analysisOpacity}
              showMaxMinLabels={showMaxMinLabels}
              maxMinOpacity={maxMinOpacity}
              maxMinColor={maxMinColor}
              showMaLabelsOnPriceScale={showMaLabelsOnPriceScale}
              showPricePath={showPricePath}
              onChartRefReady={setMainChartRef}
            />
          </div>

          {/* Panel RSI separado */}
          {showRSI && historicalChartData.length > 0 && (
            <div className={`shadow-lg rounded-lg overflow-hidden ${theme === 'dark' ? 'border border-slate-600' : 'border border-gray-300'}`}>
              <RSIPanel
                data={historicalChartData}
                theme={theme}
                height={rsiHeight}
                period={rsiPeriod}
                overboughtLevel={rsiOverboughtLevel}
                oversoldLevel={rsiOversoldLevel}
                showLevel80={rsiLevel80}
                showLevel20={rsiLevel20}
                rsiColor={rsiColor}
                overboughtColor={rsiOverboughtColor}
                oversoldColor={rsiOversoldColor}
                backgroundColor={rsiBackgroundColor === 'transparent' ? chartPaneBackgroundColor : rsiBackgroundColor}
                mainChartRef={mainChartRef}
                currentTimezone={currentTimezone}
                onTimezoneChange={handleTimezoneChange}
              />
            </div>
          )}
        </div>
        <div
          id="controls-analysis-panel"
          className={`w-full md:w-80 lg:w-[360px] xl:w-[400px] flex-none flex flex-col gap-2 sm:gap-4 overflow-y-auto order-2 md:order-1 ${!isPanelVisible ? 'hidden' : ''}`}
        >
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} p-1 rounded-lg shadow-md flex-shrink-0 order-1 md:order-none`}>
            <ControlsPanel
              symbolInput={symbolInput} setSymbolInput={handleMultiAssetSymbolChange}
              dataSource={dataSource} setDataSource={handleMultiAssetDataSourceChange}
              instrumentType={instrumentType} setInstrumentType={handleInstrumentTypeChange}
              onRequestAnalysis={handleRequestAnalysis}
              onRequestChat={handleShowChat}
              isLoading={analysisLoading || chatLoading}
              apiKeyPresent={apiKeyPresent}
              isChartLoading={isChartLoading}
              showAiAnalysisDrawings={showAiAnalysisDrawings}
              setShowAiAnalysisDrawings={setShowAiAnalysisDrawings}
              analysisPanelMode={analysisPanelMode}
              hasAnalysisResult={!!analysisResult && analysisResult.analisis_general?.simbolo === (actualSymbol.includes('-') ? actualSymbol.replace('-', '/') : (actualSymbol.endsWith('USDT') ? actualSymbol.replace(/USDT$/, '/USDT') : actualSymbol)) && analysisResult.analisis_general?.temporalidad_principal_analisis === timeframe.toUpperCase()}
            />
          </div>

          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-md flex-grow flex flex-col order-2 md:order-none`}>
            <AnalysisPanel
              panelMode={analysisPanelMode}
              analysisResult={analysisResult}
              analysisLoading={analysisLoading}
              analysisError={analysisError}
              chatMessages={chatMessages}
              chatLoading={chatLoading}
              chatError={chatError}
              onSendMessage={handleSendMessageToChat}
              onClearChatHistory={handleClearChatHistory}
              theme={theme}
              isMobile={isMobile}
              apiKeyPresent={apiKeyPresent}
            />
          </div>
        </div>
      </main>

      {displaySettingsDialogOpen && (
        <DisplaySettingsDialog
          isOpen={displaySettingsDialogOpen}
          onClose={() => setDisplaySettingsDialogOpen(false)}
          theme={theme}
          movingAverages={movingAverages}
          setMovingAverages={setMovingAverages}
          chartPaneBackgroundColor={chartPaneBackgroundColor}
          setChartPaneBackgroundColor={setChartPaneBackgroundColor}
          volumePaneHeight={volumePaneHeight}
          setVolumePaneHeight={setVolumePaneHeight}
          wSignalColor={wSignalColor}
          setWSignalColor={setWSignalColor}
          wSignalOpacity={wSignalOpacity}
          setWSignalOpacity={setWSignalOpacity}
          showWSignals={showWSignals}
          setShowWSignals={setShowWSignals}
          // Nuevas props para controles avanzados
          showMovingAverages={showMovingAverages}
          onMovingAveragesToggle={setShowMovingAverages}
          maOpacity={maOpacity}
          onMaOpacityChange={setMaOpacity}
          showMaLabelsOnPriceScale={showMaLabelsOnPriceScale}
          onMaLabelsOnPriceScaleToggle={setShowMaLabelsOnPriceScale}
          showAiAnalysisDrawings={showAiAnalysisDrawings}
          onAnalysisDrawingsToggle={setShowAiAnalysisDrawings}
          analysisOpacity={analysisOpacity}
          onAnalysisOpacityChange={setAnalysisOpacity}
          showMaxMinLabels={showMaxMinLabels}
          onMaxMinLabelsToggle={setShowMaxMinLabels}
          maxMinOpacity={maxMinOpacity}
          onMaxMinOpacityChange={setMaxMinOpacity}
          maxMinColor={maxMinColor}
          onMaxMinColorChange={setMaxMinColor}
          // RSI props
          showRSI={showRSI}
          onRSIToggle={setShowRSI}
          rsiPeriod={rsiPeriod}
          onRSIPeriodChange={setRsiPeriod}
          rsiHeight={rsiHeight}
          onRSIHeightChange={setRsiHeight}
          rsiOverboughtLevel={rsiOverboughtLevel}
          onRSIOverboughtLevelChange={setRsiOverboughtLevel}
          rsiOversoldLevel={rsiOversoldLevel}
          onRSIOversoldLevelChange={setRsiOversoldLevel}
          rsiLevel80={rsiLevel80}
          onRSILevel80Toggle={setRsiLevel80}
          rsiLevel20={rsiLevel20}
          onRSILevel20Toggle={setRsiLevel20}
          rsiColor={rsiColor}
          onRSIColorChange={setRsiColor}
          rsiOverboughtColor={rsiOverboughtColor}
          onRSIOverboughtColorChange={setRsiOverboughtColor}
          rsiOversoldColor={rsiOversoldColor}
          onRSIOversoldColorChange={setRsiOversoldColor}
          rsiBackgroundColor={rsiBackgroundColor}
          onRSIBackgroundColorChange={setRsiBackgroundColor}
        />
      )}
    </div>
  );
};

export default App;
