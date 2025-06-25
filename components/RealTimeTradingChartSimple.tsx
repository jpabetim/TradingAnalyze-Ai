import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart, IChartApi, ISeriesApi,
  CandlestickData as LWCCandlestickData, LineData as LWCLineData,
  LineStyle, UTCTimestamp, PriceScaleMode, IPriceLine, DeepPartial, ChartOptions,
  CandlestickSeriesOptions, LineSeriesOptions, HistogramSeriesOptions, ColorType
} from 'lightweight-charts';
import { DataSource, GeminiAnalysisResult, MovingAverageConfig } from '../types';
import { mapTimeframeToApi } from '../constants';
import { fetchWithProxy } from '../utils/networkUtils';
import { createForexProviderService, isForexProvider } from '../services/forexProviders';
import RSIPanel from './RSIPanel';

type Theme = 'dark' | 'light';

interface RealTimeTradingChartProps {
  dataSource: DataSource;
  symbol: string;
  timeframe: string;
  analysisResult: GeminiAnalysisResult | null;
  onLatestChartInfoUpdate: (info: { price: number | null; volume?: number | null }) => void;
  onChartLoadingStateChange: (isLoading: boolean) => void;
  onHistoricalDataUpdate?: (data: CandlestickData[]) => void;
  movingAverages: MovingAverageConfig[];
  theme: Theme;
  chartPaneBackgroundColor: string;
  volumePaneHeight: number;
  showAiAnalysisDrawings: boolean;
  candleLimit: number;

  // Propiedades para controles de indicadores
  showMovingAverages: boolean;
  maOpacity: number;
  analysisOpacity: number;
  showMaxMinLabels: boolean;
  maxMinOpacity: number;
  maxMinColor: string;
  showMaLabelsOnPriceScale: boolean;
  showPricePath: boolean;

  // Prop para recibir referencia del gráfico (para sincronización con RSI)
  onChartRefReady?: (chartRef: React.RefObject<IChartApi | null>) => void;

  // Props para RSI interno opcional
  showInternalRSI?: boolean;
  rsiPaneHeight?: number;
}

type CandlestickData = LWCCandlestickData<UTCTimestamp> & { volume?: number };
type LineData = LWCLineData<UTCTimestamp>;

// Simple provider configs for crypto exchanges
const CRYPTO_PROVIDERS = {
  binance: {
    name: 'Binance Futures',
    historicalApi: (symbol: string, interval: string, limit: number) =>
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    formatSymbol: (s: string) => s.replace(/[^A-Z0-9]/g, '').toUpperCase(),
    parseHistorical: (data: any[]) => {
      return data.map((k: any) => ({
        time: (k[0] / 1000) as UTCTimestamp,
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }));
    }
  },
  bingx: {
    name: 'BingX Futures',
    historicalApi: (symbol: string, interval: string, limit: number) =>
      `https://open-api.bingx.com/openApi/swap/v2/quote/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    formatSymbol: (s: string) => {
      // Corregir formato de símbolo: ETH/USDT -> ETH-USDT
      return s.replace(/[-/]/g, '-').toUpperCase();
    },
    parseHistorical: (data: any) => {
      if (data?.data) {
        return data.data.map((k: any) => ({
          time: (k.time / 1000) as UTCTimestamp,
          open: parseFloat(k.open),
          high: parseFloat(k.high),
          low: parseFloat(k.low),
          close: parseFloat(k.close),
          volume: parseFloat(k.volume)
        }));
      }
      return [];
    }
  }
};

const THEME_COLORS = {
  dark: {
    background: '#18191B',
    text: '#D1D5DB',
    grid: 'rgba(55, 65, 81, 0.2)', // Reducida opacidad del 100% al 20%
    border: '#4B5563'
  },
  light: {
    background: '#FFFFFF',
    text: '#374151',
    grid: 'rgba(229, 231, 235, 0.2)', // Reducida opacidad del 100% al 20%
    border: '#D1D5DB'
  }
};

// Moving average calculation functions
const calculateMA = (data: CandlestickData[], period: number): LineData[] => {
  if (data.length < period) return [];
  const results: LineData[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    results.push({ time: data[i].time, value: sum / period });
  }
  return results;
};

const calculateEMA = (data: CandlestickData[], period: number): LineData[] => {
  if (data.length < period) return [];
  const results: LineData[] = [];
  const k = 2 / (period + 1);

  let sumForSma = 0;
  for (let i = 0; i < period; i++) {
    sumForSma += data[i].close;
  }

  let ema = sumForSma / period;
  results.push({ time: data[period - 1].time, value: ema });

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close * k) + (ema * (1 - k));
    results.push({ time: data[i].time, value: ema });
  }

  return results;
};

// Función para calcular media móvil del volumen
const calculateVolumeMA = (data: CandlestickData[], period: number): LineData[] => {
  if (data.length < period) return [];

  const results: LineData[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].volume || 0;
    }
    const average = sum / period;
    results.push({ time: data[i].time, value: average });
  }

  return results;
};

const RealTimeTradingChart: React.FC<RealTimeTradingChartProps> = ({
  dataSource,
  symbol: rawSymbol,
  timeframe: rawTimeframe,
  analysisResult,
  onLatestChartInfoUpdate,
  onChartLoadingStateChange,
  onHistoricalDataUpdate,
  movingAverages,
  theme,
  chartPaneBackgroundColor,
  volumePaneHeight,
  showAiAnalysisDrawings,
  candleLimit,

  // Propiedades de indicadores
  showMovingAverages,
  maOpacity,
  analysisOpacity,
  showMaxMinLabels,
  maxMinOpacity,
  maxMinColor,
  showMaLabelsOnPriceScale,
  showPricePath,

  // Nueva prop para sincronización
  onChartRefReady,

  // Props para RSI interno opcional
  showInternalRSI = false,
  rsiPaneHeight = 80,
}) => {
  // Log solo al cambiar props importantes
  console.log('🚀 RealTimeTradingChart render:', { rawSymbol, rawTimeframe, dataSource });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const volumeMA55SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const maSeriesRefs = useRef<Record<string, ISeriesApi<'Line'>>>({});
  const initializingRef = useRef<boolean>(false); // Prevent multiple simultaneous initializations

  // Nuevas referencias para análisis y etiquetas
  const analysisLinesRef = useRef<IPriceLine[]>([]);
  const maxMinPriceLinesRef = useRef<{ max: IPriceLine | null; min: IPriceLine | null }>({ max: null, min: null });
  const tradingLinesRef = useRef<IPriceLine[]>([]); // Nueva referencia para líneas de trading
  const pricePathSeriesRef = useRef<ISeriesApi<'Line'> | null>(null); // Referencia para el camino probable

  const [historicalData, setHistoricalData] = useState<CandlestickData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'ok' | 'error'>('connecting');
  const [autoFitEnabled, setAutoFitEnabled] = useState<boolean>(false);

  // Reduced state logging
  // console.log('🔄 Chart state:', { connectionStatus, historicalDataLength: historicalData.length });

  // Handle different provider types
  const isCryptoProvider = !isForexProvider(dataSource);
  const apiTimeframe = mapTimeframeToApi(rawTimeframe);

  // Memoize formatted symbol and provider service to prevent infinite re-renders
  const { formattedSymbol } = React.useMemo(() => {
    // console.log('🧠 MEMOIZING SYMBOL AND PROVIDER', { dataSource, rawSymbol, isCryptoProvider });

    let symbol = '';
    let service: any = null;

    if (isCryptoProvider) {
      const cryptoProvider = CRYPTO_PROVIDERS[dataSource as keyof typeof CRYPTO_PROVIDERS];
      if (cryptoProvider) {
        symbol = cryptoProvider.formatSymbol(rawSymbol);
      }
    } else {
      try {
        service = createForexProviderService(dataSource);
        symbol = service.formatSymbol(rawSymbol);
      } catch (error) {
        console.error('Error creating forex provider service:', error);
      }
    }

    // console.log('📝 MEMOIZED RESULT:', { symbol, hasService: !!service });
    return { formattedSymbol: symbol };
  }, [dataSource, rawSymbol]);

  // Función para manejar auto-fit del gráfico
  const handleAutoFit = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
      setAutoFitEnabled(true);
      // Desactivar auto-fit después de un breve momento
      setTimeout(() => setAutoFitEnabled(false), 1000);
    }
  }, []);

  // Función para agregar etiquetas MAX/MIN al gráfico
  const addMaxMinLabels = useCallback((data: CandlestickData[]) => {
    if (!chartRef.current || !candlestickSeriesRef.current || !showMaxMinLabels || data.length === 0) {
      return;
    }

    // Remover etiquetas anteriores
    if (maxMinPriceLinesRef.current.max) {
      candlestickSeriesRef.current.removePriceLine(maxMinPriceLinesRef.current.max);
    }
    if (maxMinPriceLinesRef.current.min) {
      candlestickSeriesRef.current.removePriceLine(maxMinPriceLinesRef.current.min);
    }

    // Encontrar max y min en el conjunto de datos visible
    const maxPrice = Math.max(...data.map(d => d.high));
    const minPrice = Math.min(...data.map(d => d.low));

    // Aplicar opacidad al color
    const colorWithOpacity = `${maxMinColor}${Math.round(maxMinOpacity * 255).toString(16).padStart(2, '0')}`;

    // Agregar línea de precio máximo
    const maxLine = candlestickSeriesRef.current.createPriceLine({
      price: maxPrice,
      color: colorWithOpacity,
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
      axisLabelVisible: true,
      title: `MAX: ${maxPrice.toFixed(4)}`,
    });

    // Agregar línea de precio mínimo  
    const minLine = candlestickSeriesRef.current.createPriceLine({
      price: minPrice,
      color: colorWithOpacity,
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
      axisLabelVisible: true,
      title: `MIN: ${minPrice.toFixed(4)}`,
    });

    maxMinPriceLinesRef.current = { max: maxLine, min: minLine };
  }, [showMaxMinLabels, maxMinColor, maxMinOpacity]);

  // Colores específicos para diferentes tipos de análisis
  const getAnalysisColors = () => ({
    fvg: {
      bullish: `rgba(34, 197, 94, ${analysisOpacity})`, // Verde para FVG alcista
      bearish: `rgba(239, 68, 68, ${analysisOpacity})` // Rojo para FVG bajista
    },
    orderBlock: {
      bullish: `rgba(59, 130, 246, ${analysisOpacity})`, // Azul para OB alcista
      bearish: `rgba(249, 115, 22, ${analysisOpacity})` // Naranja para OB bajista
    },
    bsl: `rgba(168, 85, 247, ${analysisOpacity})`, // Púrpura para BSL
    entry: {
      long: `rgba(34, 197, 94, ${analysisOpacity})`, // Verde para entradas long
      short: `rgba(239, 68, 68, ${analysisOpacity})` // Rojo para entradas short
    },
    takeProfit: `rgba(251, 191, 36, ${analysisOpacity})`, // Amarillo para TP
    stopLoss: `rgba(220, 38, 127, ${analysisOpacity})`, // Rosa para SL
    // Colores grises para señales de trading del TradeSetup
    trading: {
      entry: `rgba(156, 163, 175, ${analysisOpacity})`, // Gris para entrada de trading
      entryZone: `rgba(156, 163, 175, ${analysisOpacity * 0.5})`, // Gris más claro para zona de entrada
      takeProfit: `rgba(156, 163, 175, ${analysisOpacity})`, // Gris para TP
      stopLoss: `rgba(156, 163, 175, ${analysisOpacity})` // Gris para SL
    }
  });  // Función para determinar el color según el tipo de nivel de análisis
  const getColorForAnalysisLevel = useCallback((level: any) => {
    const colors = getAnalysisColors();

    // El objeto puede tener 'tipo' o 'type'
    const levelType = level.tipo || level.type;

    if (!levelType) return `rgba(156, 163, 175, ${analysisOpacity})`; // Gris por defecto

    const type = levelType.toLowerCase();

    // FVG (Fair Value Gaps)
    if (type.includes('fvg')) {
      return level.direction?.toLowerCase() === 'bearish' ? colors.fvg.bearish : colors.fvg.bullish;
    }

    // Order Blocks
    if (type.includes('ob') || type.includes('order block') || type.includes('poi')) {
      return level.direction?.toLowerCase() === 'bearish' || type.includes('oferta') ?
        colors.orderBlock.bearish : colors.orderBlock.bullish;
    }

    // BSL (Buy/Sell Side Liquidity)
    if (type.includes('bsl') || type.includes('liquidity') || type.includes('liquidez')) {
      return colors.bsl;
    }

    // BOS/ChoCH
    if (type.includes('bos') || type.includes('choch')) {
      return type.includes('bajista') ? colors.fvg.bearish : colors.fvg.bullish;
    }

    // Entradas
    if (type.includes('entry') || type.includes('entrada')) {
      return level.direction?.toLowerCase() === 'short' || type.includes('corto') ?
        colors.entry.short : colors.entry.long;
    }

    // Take Profit
    if (type.includes('tp') || type.includes('take profit') || type.includes('objetivo')) {
      return colors.takeProfit;
    }

    // Stop Loss
    if (type.includes('sl') || type.includes('stop loss') || type.includes('perdida')) {
      return colors.stopLoss;
    }

    // Fibonacci
    if (type.includes('fibonacci') || type.includes('fib')) {
      return colors.bsl; // Usar púrpura para fibonacci
    }

    // Fibonacci Extension
    if (type.includes('fibonacci_ext') || type.includes('fib_ext')) {
      return colors.stopLoss; // Usar color de stop loss para extensiones fibonacci
    }

    return `rgba(156, 163, 175, ${analysisOpacity})`; // Gris por defecto
  }, [analysisOpacity]);

  // Memoize chart options to prevent unnecessary re-renders
  const chartOptions = React.useMemo((): DeepPartial<ChartOptions> => {
    const effectiveBackgroundColor = chartPaneBackgroundColor ||
      (theme === 'dark' ? THEME_COLORS.dark.background : THEME_COLORS.light.background);
    const textColor = theme === 'dark' ? THEME_COLORS.dark.text : THEME_COLORS.light.text;

    // Colores de cuadrícula con menor opacidad
    const gridColor = theme === 'dark' ? '#37415133' : '#E5E7EB33'; // Añadida transparencia 33 (20% opacidad)
    const borderColor = theme === 'dark' ? THEME_COLORS.dark.border : THEME_COLORS.light.border;

    return {
      layout: {
        background: { type: ColorType.Solid, color: effectiveBackgroundColor },
        textColor: textColor
      },
      grid: {
        vertLines: {
          color: gridColor,
          style: 0, // Solid lines
          visible: true,
        },
        horzLines: {
          color: gridColor,
          style: 0, // Solid lines  
          visible: true,
        }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: apiTimeframe.includes('m'),
        borderColor: borderColor
      },
      rightPriceScale: {
        mode: PriceScaleMode.Normal,
        autoScale: true,
        scaleMargins: { top: 0.1, bottom: 0.05 },
        borderColor: borderColor,
        textColor: textColor,
        entireTextOnly: false, // Permite etiquetas parciales
        minimumWidth: 80, // Ancho mínimo de la escala
        visible: true
      },
      autoSize: true,
      // Enable chart interaction
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      crosshair: {
        vertLine: {
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          visible: true,
          labelVisible: true,
        },
      },
      // Ocultar watermark/logo de TradingView
      watermark: {
        visible: false,
      },
    };
  }, [theme, chartPaneBackgroundColor, apiTimeframe]);

  useEffect(() => {
    console.log('🔥 MAIN CHART USEEFFECT TRIGGERED', {
      dataSource,
      rawSymbol,
      rawTimeframe,
      candleLimit,
      chartPaneBackgroundColor,
      theme,
      volumePaneHeight,
      formattedSymbol,
      hasChartContainer: !!chartContainerRef.current
    });

    const chartEl = chartContainerRef.current;
    if (!chartEl || !formattedSymbol) {
      console.log('❌ Early return: missing chartEl or formattedSymbol');
      onChartLoadingStateChange(false);
      return;
    }

    // Prevent multiple simultaneous initializations
    if (initializingRef.current) {
      console.log('🚫 Chart initialization already in progress, skipping...');
      return;
    }

    initializingRef.current = true;

    // Cleanup previous chart and reset state
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        console.warn('Error disposing previous chart:', error);
      }
      chartRef.current = null;
    }

    // Reset state to prevent stale data
    setHistoricalData([]);

    // Notificar al componente padre que se han limpiado los datos históricos
    if (onHistoricalDataUpdate) {
      onHistoricalDataUpdate([]);
    }
    candlestickSeriesRef.current = null;
    volumeSeriesRef.current = null;
    volumeMA55SeriesRef.current = null;
    maSeriesRefs.current = {};
    analysisLinesRef.current = [];
    maxMinPriceLinesRef.current = { max: null, min: null };
    // NO resetear tradingLinesRef aquí - se manejará por separado según el cambio

    onChartLoadingStateChange(true);

    chartRef.current = createChart(chartEl, chartOptions);

    // Notificar que el gráfico está listo para sincronización
    if (onChartRefReady) {
      onChartRefReady(chartRef);
    }

    // Ocultar el logo de TradingView
    setTimeout(() => {
      const tradingViewLogo = chartEl.querySelector('[data-name="legend-source-item"]');
      if (tradingViewLogo) {
        (tradingViewLogo as HTMLElement).style.display = 'none';
      }

      // También intentar ocultar por clase
      const logoByClass = chartEl.querySelector('.tv-lightweight-charts__legend');
      if (logoByClass) {
        (logoByClass as HTMLElement).style.display = 'none';
      }

      // Estilo CSS general para ocultar logos
      const style = document.createElement('style');
      style.textContent = `
        .tv-lightweight-charts__legend,
        [data-name="legend-source-item"],
        .tv-lightweight-charts__legend-wrapper {
          display: none !important;
        }
      `;
      if (!document.querySelector('#hide-tradingview-logo')) {
        style.id = 'hide-tradingview-logo';
        document.head.appendChild(style);
      }
    }, 100);

    // Create candlestick series
    const candlestickOptions: DeepPartial<CandlestickSeriesOptions> = {
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444'
    };
    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries(candlestickOptions);

    // Create volume series if needed
    if (volumePaneHeight > 0) {
      const volumeOptions: DeepPartial<HistogramSeriesOptions> = {
        color: '#26A69A',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume_scale',
      };
      volumeSeriesRef.current = chartRef.current.addHistogramSeries(volumeOptions);

      chartRef.current.priceScale('volume_scale').applyOptions({
        scaleMargins: { top: 0, bottom: 0.9 }, // Volumen más pequeño, más espacio para el gráfico principal
      });
    }

    // Fetch historical data
    const fetchHistoricalData = async () => {
      try {
        setConnectionStatus('connecting'); // Marcar como conectando
        console.log('📊 Fetching historical data...');
        let parsedData: CandlestickData[] = [];

        if (dataSource === 'yfinance') {
          // YFinance requiere backend - temporalmente deshabilitado
          console.warn('YFinance requiere servidor backend. Use proveedores crypto (Binance/BingX) en su lugar.');
          parsedData = [];
        } else if (isCryptoProvider) {
          // Usar APIs directas para proveedores crypto (Binance, BingX)
          const cryptoProvider = CRYPTO_PROVIDERS[dataSource as keyof typeof CRYPTO_PROVIDERS];
          if (cryptoProvider) {
            console.log(`📊 Fetching from ${cryptoProvider.name}...`);
            const apiUrl = cryptoProvider.historicalApi(formattedSymbol, apiTimeframe, candleLimit);
            console.log('🔗 API URL:', apiUrl);

            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              }
            });

            if (!response.ok) {
              console.error(`❌ HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Raw data from API:', data);
            parsedData = cryptoProvider.parseHistorical(data);
            console.log('✅ Crypto data parsed:', parsedData.length, 'candles');
          }
        } else {
          // Otros proveedores forex requieren backend - temporalmente deshabilitado
          console.warn('Proveedores forex requieren servidor backend. Use proveedores crypto (Binance/BingX) en su lugar.');
          parsedData = [];
        }

        console.log('✅ Historical data loaded:', parsedData.length, 'candles');
        setHistoricalData(parsedData);

        // Notificar al componente padre con los datos históricos para RSI
        if (onHistoricalDataUpdate) {
          onHistoricalDataUpdate(parsedData);
        }

        // Set data to series
        if (candlestickSeriesRef.current && parsedData.length > 0) {
          candlestickSeriesRef.current.setData(parsedData);

          // Set volume data if series exists
          if (volumeSeriesRef.current) {
            const volumeData = parsedData.map(item => ({
              time: item.time,
              value: item.volume || 0,
              color: item.close >= item.open ? '#26A69A' : '#EF5350'
            }));
            volumeSeriesRef.current.setData(volumeData);
          }

          // Fit content and update loading state
          chartRef.current?.timeScale().fitContent();
          onChartLoadingStateChange(false);

          // Notificar el precio actual y volumen al componente padre para la IA
          const latestCandle = parsedData[parsedData.length - 1];
          if (latestCandle && onLatestChartInfoUpdate) {
            onLatestChartInfoUpdate({
              price: latestCandle.close,
              volume: latestCandle.volume || null
            });
          }

          console.log('✅ Chart data set successfully');
          setConnectionStatus('ok'); // Marcar conexión como exitosa
        } else {
          setConnectionStatus('error'); // Error si no hay datos
        }

        initializingRef.current = false; // Reset initialization flag
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setConnectionStatus('error'); // Marcar error de conexión
        onChartLoadingStateChange(false); // Reset loading state on error
        initializingRef.current = false; // Reset initialization flag
      }
    };

    fetchHistoricalData();

    // Cleanup function
    return () => {
      initializingRef.current = false; // Reset initialization flag

      // Clean up all series references
      Object.entries(maSeriesRefs.current).forEach(([key, series]) => {
        if (series) {
          try {
            chartRef.current?.removeSeries(series);
          } catch (error) {
            console.warn(`Error removing MA series ${key} in cleanup:`, error);
          }
        }
      });
      maSeriesRefs.current = {};

      // Clean up price lines
      analysisLinesRef.current.forEach(line => {
        if (line && candlestickSeriesRef.current) {
          try {
            candlestickSeriesRef.current.removePriceLine(line);
          } catch (error) {
            console.warn('Error removing analysis line in cleanup:', error);
          }
        }
      });
      analysisLinesRef.current = [];

      // Clean up max/min lines
      if (maxMinPriceLinesRef.current.max && candlestickSeriesRef.current) {
        try {
          candlestickSeriesRef.current.removePriceLine(maxMinPriceLinesRef.current.max);
        } catch (error) {
          console.warn('Error removing max line in cleanup:', error);
        }
      }
      if (maxMinPriceLinesRef.current.min && candlestickSeriesRef.current) {
        try {
          candlestickSeriesRef.current.removePriceLine(maxMinPriceLinesRef.current.min);
        } catch (error) {
          console.warn('Error removing min line in cleanup:', error);
        }
      }
      maxMinPriceLinesRef.current = { max: null, min: null };

      // Clean up chart
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          console.warn('Error disposing chart in cleanup:', error);
        }
        chartRef.current = null;
      }

      // Reset series references
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [
    dataSource,
    rawSymbol,
    // rawTimeframe REMOVIDO - no debe reinicializar el gráfico al cambiar timeframe
    candleLimit,
    volumePaneHeight,
    formattedSymbol,
    theme,
    chartPaneBackgroundColor
  ]);

  // useEffect separado para resetear líneas de trading solo cuando cambia símbolo o dataSource
  // NO cuando cambia timeframe - las señales deben persistir al cambiar temporalidad
  useEffect(() => {
    // Limpiar líneas de trading anteriores solo al cambiar símbolo o dataSource
    tradingLinesRef.current.forEach(line => {
      if (candlestickSeriesRef.current) {
        try {
          candlestickSeriesRef.current.removePriceLine(line);
        } catch (error) {
          console.warn('Error removing trading line on symbol/dataSource change:', error);
        }
      }
    });
    tradingLinesRef.current = [];
  }, [dataSource, rawSymbol, formattedSymbol]); // Solo depende del símbolo y dataSource, NO del timeframe

  // useEffect separado para recargar datos cuando cambia el timeframe
  // SIN reinicializar el gráfico ni limpiar las señales de análisis
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !formattedSymbol) {
      return;
    }

    const fetchTimeframeData = async () => {
      console.log('📈 Reloading data for timeframe change:', rawTimeframe);
      onChartLoadingStateChange(true);

      try {
        const apiTimeframe = mapTimeframeToApi(rawTimeframe);
        if (!apiTimeframe) {
          console.error('❌ Invalid timeframe:', rawTimeframe);
          onChartLoadingStateChange(false);
          return;
        }

        if (isCryptoProvider) {
          const cryptoProvider = CRYPTO_PROVIDERS[dataSource as keyof typeof CRYPTO_PROVIDERS];
          if (!cryptoProvider) {
            throw new Error(`Unsupported crypto provider: ${dataSource}`);
          }

          console.log(`📊 Fetching from ${cryptoProvider.name}...`);
          const url = cryptoProvider.historicalApi(formattedSymbol, apiTimeframe, candleLimit);
          console.log('🔗 API URL:', url);

          const response = await fetch(url);
          const data = await response.json();

          console.log('📦 Raw data from API:', data);
          const parsedData = cryptoProvider.parseHistorical(data);
          console.log('✅ Crypto data parsed:', parsedData.length, 'candles');

          if (parsedData.length > 0) {
            setHistoricalData(parsedData);
            if (candlestickSeriesRef.current) {
              candlestickSeriesRef.current.setData(parsedData);
            }

            // Update volume data if series exists
            if (volumeSeriesRef.current) {
              const volumeData = parsedData.map((item: CandlestickData) => ({
                time: item.time,
                value: item.volume || 0,
                color: item.close >= item.open ? '#26A69A' : '#EF5350'
              }));
              volumeSeriesRef.current.setData(volumeData);
            }

            // Fit content and notify price update
            if (chartRef.current) {
              chartRef.current.timeScale().fitContent();
            }

            const latestCandle = parsedData[parsedData.length - 1];
            if (latestCandle && onLatestChartInfoUpdate) {
              onLatestChartInfoUpdate({
                price: latestCandle.close,
                volume: latestCandle.volume || null
              });
            }

            console.log('✅ Timeframe data updated successfully');
          }
        }

        onChartLoadingStateChange(false);
      } catch (error) {
        console.error('❌ Error updating timeframe data:', error);
        onChartLoadingStateChange(false);
      }
    };

    fetchTimeframeData();
  }, [rawTimeframe, apiTimeframe]); // Solo se ejecuta cuando cambia el timeframe

  // Update moving averages
  useEffect(() => {
    if (!chartRef.current || historicalData.length === 0) return;

    // Remove existing MA series safely
    Object.entries(maSeriesRefs.current).forEach(([key, series]) => {
      if (chartRef.current && series) {
        try {
          chartRef.current.removeSeries(series);
        } catch (error) {
          console.warn(`Error removing MA series ${key}:`, error);
        }
      }
    });
    maSeriesRefs.current = {};

    // Add visible MAs only if showMovingAverages is true
    if (showMovingAverages) {
      movingAverages.forEach(ma => {
        if (!ma.visible || !chartRef.current) return;

        const maData = ma.type === 'EMA'
          ? calculateEMA(historicalData, ma.period)
          : calculateMA(historicalData, ma.period);

        if (maData.length > 0) {
          // Aplicar opacidad al color
          const colorWithOpacity = ma.color + Math.round(maOpacity * 255).toString(16).padStart(2, '0');

          const lineOptions: DeepPartial<LineSeriesOptions> = {
            color: colorWithOpacity,
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            title: '', // Sin título/nombre para las medias móviles
            lastValueVisible: showMaLabelsOnPriceScale,
            priceLineVisible: false
          };

          const series = chartRef.current.addLineSeries(lineOptions);
          series.setData(maData);
          maSeriesRefs.current[ma.id] = series;
        }
      });
    }
  }, [movingAverages, historicalData, showMovingAverages, maOpacity, showMaLabelsOnPriceScale]);

  // Draw analysis results with proper styling
  useEffect(() => {
    console.log('🔍 DEBUG useEffect analysis triggered:', {
      hasChartRef: !!chartRef.current,
      hasCandlestickRef: !!candlestickSeriesRef.current,
      hasAnalysisResult: !!analysisResult,
      showAiAnalysisDrawings,
      analysisOpacity
    });

    if (!chartRef.current || !candlestickSeriesRef.current) {
      console.log('🚫 Early return: Chart refs not ready');
      return;
    }

    // DEBUG: Ver los puntos clave recibidos
    if (analysisResult && analysisResult.puntos_clave_grafico) {
      console.log('🟢 puntos_clave_grafico recibidos:', analysisResult.puntos_clave_grafico);
      console.log('🟢 showAiAnalysisDrawings:', showAiAnalysisDrawings);
      
      if (!showAiAnalysisDrawings) {
        console.log('❌ showAiAnalysisDrawings está en FALSE - No se dibujarán los puntos');
        return;
      }
    } else {
      console.log('🔴 No hay puntos_clave_grafico en analysisResult:', analysisResult);
    }

    // Limpiar líneas de análisis anteriores
    analysisLinesRef.current.forEach(line => {
      if (candlestickSeriesRef.current && line) {
        try {
          candlestickSeriesRef.current.removePriceLine(line);
        } catch (error) {
          console.warn('Error removing analysis line:', error);
        }
      }
    });
    analysisLinesRef.current = [];

    // Dibujar nuevas líneas de análisis si están habilitadas y hay datos
    if (analysisResult && showAiAnalysisDrawings && analysisResult.puntos_clave_grafico) {
      analysisResult.puntos_clave_grafico.forEach((punto, index) => {
        if (candlestickSeriesRef.current) {
          let price: number | null = null;

          // Obtener el precio del punto según su tipo
          if (punto.nivel) {
            price = punto.nivel;
          } else if (punto.zona && punto.zona.length >= 2) {
            price = (punto.zona[0] + punto.zona[1]) / 2; // Usar el precio medio de la zona
          }

          if (price !== null) {
            // Usar el color específico basado en el tipo de análisis
            const baseColor = getColorForAnalysisLevel(punto);

            // Determinar el estilo de línea basado en el tipo
            let lineStyle = LineStyle.Dashed;
            let lineWidth: 1 | 2 | 3 | 4 = 1;

            // Estilos específicos para diferentes tipos
            const tipo = (punto.tipo || '').toLowerCase();
            if (tipo.includes('entrada') || tipo.includes('entry')) {
              lineStyle = LineStyle.Solid;
              lineWidth = 2; // Más grueso para entradas
            } else if (tipo.includes('tp') || tipo.includes('take profit')) {
              lineStyle = LineStyle.Dotted;
              lineWidth = 1;
            } else if (tipo.includes('sl') || tipo.includes('stop loss')) {
              lineStyle = LineStyle.SparseDotted;
              lineWidth = 1;
            }

            const priceLine = candlestickSeriesRef.current.createPriceLine({
              price: price,
              color: baseColor,
              lineWidth: lineWidth,
              lineStyle: lineStyle,
              axisLabelVisible: true,
              title: punto.label || `${punto.tipo} ${index + 1}`,
            });

            analysisLinesRef.current.push(priceLine);
          }
        }
      });

      console.log(`Dibujadas ${analysisLinesRef.current.length} líneas de análisis AI`);
    }

    // Dibujar niveles de Fibonacci si están disponibles
    if (analysisResult && showAiAnalysisDrawings && analysisResult.analisis_fibonacci) {
      const fibAnalysis = analysisResult.analisis_fibonacci;

      // Dibujar niveles de retroceso Fibonacci
      if (fibAnalysis.niveles_retroceso) {
        fibAnalysis.niveles_retroceso.forEach((fibLevel) => {
          if (candlestickSeriesRef.current) {
            const fibLine = candlestickSeriesRef.current.createPriceLine({
              price: fibLevel.price,
              color: getColorForAnalysisLevel({ tipo: 'fibonacci' }),
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `Fib ${(fibLevel.level * 100).toFixed(1)}%`,
            });

            analysisLinesRef.current.push(fibLine);
          }
        });
        console.log(`Dibujados ${fibAnalysis.niveles_retroceso.length} niveles Fibonacci`);
      }

      // Dibujar niveles de extensión Fibonacci si están disponibles
      if (fibAnalysis.niveles_extension) {
        fibAnalysis.niveles_extension.forEach((fibLevel) => {
          if (candlestickSeriesRef.current) {
            const fibLine = candlestickSeriesRef.current.createPriceLine({
              price: fibLevel.price,
              color: getColorForAnalysisLevel({ tipo: 'fibonacci_ext' }),
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              axisLabelVisible: true,
              title: `Fib Ext ${(fibLevel.level * 100).toFixed(1)}%`,
            });

            analysisLinesRef.current.push(fibLine);
          }
        });
        console.log(`Dibujados ${fibAnalysis.niveles_extension.length} niveles Fibonacci Extensión`);
      }
    }
  }, [analysisResult, showAiAnalysisDrawings, analysisOpacity]); // Removido analysisColor de las dependencias

  // Dibujar señales de trading del TradeSetup
  useEffect(() => {
    if (!candlestickSeriesRef.current || !analysisResult || !showAiAnalysisDrawings) {
      // Si no se deben mostrar las señales, limpiar líneas existentes
      if (!showAiAnalysisDrawings && tradingLinesRef.current.length > 0) {
        tradingLinesRef.current.forEach(line => {
          if (candlestickSeriesRef.current) {
            try {
              candlestickSeriesRef.current.removePriceLine(line);
            } catch (error) {
              console.warn('Error removing trading line when hiding:', error);
            }
          }
        });
        tradingLinesRef.current = [];
      }
      return;
    }

    // Limpiar líneas de trading anteriores solo si ya hay líneas dibujadas
    // (esto permite redibujar cuando cambian las propiedades pero mantiene las señales al cambiar timeframe)
    if (tradingLinesRef.current.length > 0) {
      tradingLinesRef.current.forEach(line => {
        if (candlestickSeriesRef.current) {
          try {
            candlestickSeriesRef.current.removePriceLine(line);
          } catch (error) {
            console.warn('Error removing trading line:', error);
          }
        }
      });
      tradingLinesRef.current = [];
    }

    const colors = getAnalysisColors();

    // Buscar TradeSetup en la mejor oportunidad current
    const tradeSetup = analysisResult.conclusion_recomendacion?.mejor_oportunidad_actual;

    console.log('🔍 DEBUG Trading Setup:', {
      hasConclusion: !!analysisResult.conclusion_recomendacion,
      hasMejorOportunidad: !!tradeSetup,
      tradeSetupType: tradeSetup?.tipo,
      tradeSetup: tradeSetup
    });

    if (tradeSetup && tradeSetup.tipo !== 'ninguno') {
      const isLong = tradeSetup.tipo === 'largo';

      // Dibujar entrada ideal si existe
      if (tradeSetup.punto_entrada_ideal) {
        const entryLine = candlestickSeriesRef.current.createPriceLine({
          price: tradeSetup.punto_entrada_ideal,
          color: colors.trading.entry,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `Entrada ${isLong ? 'Long' : 'Short'}`,
        });
        tradingLinesRef.current.push(entryLine);
      }

      // Dibujar zona de entrada si existe
      if (tradeSetup.zona_entrada && tradeSetup.zona_entrada.length >= 2) {
        const [minEntry, maxEntry] = tradeSetup.zona_entrada;

        // Línea superior de la zona
        const upperZoneLine = candlestickSeriesRef.current.createPriceLine({
          price: maxEntry,
          color: colors.trading.entryZone,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Zona Max`,
        });
        tradingLinesRef.current.push(upperZoneLine);

        // Línea inferior de la zona
        const lowerZoneLine = candlestickSeriesRef.current.createPriceLine({
          price: minEntry,
          color: colors.trading.entryZone,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Zona Min`,
        });
        tradingLinesRef.current.push(lowerZoneLine);
      }

      // Dibujar Stop Loss
      if (tradeSetup.stop_loss) {
        const slLine = candlestickSeriesRef.current.createPriceLine({
          price: tradeSetup.stop_loss,
          color: colors.trading.stopLoss,
          lineWidth: 1,
          lineStyle: LineStyle.SparseDotted,
          axisLabelVisible: true,
          title: `SL`,
        });
        tradingLinesRef.current.push(slLine);
      }

      // Dibujar Take Profit 1
      if (tradeSetup.take_profit_1) {
        const tp1Line = candlestickSeriesRef.current.createPriceLine({
          price: tradeSetup.take_profit_1,
          color: colors.trading.takeProfit,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `TP1`,
        });
        tradingLinesRef.current.push(tp1Line);
      }

      // Dibujar Take Profit 2 si existe
      if (tradeSetup.take_profit_2) {
        const tp2Line = candlestickSeriesRef.current.createPriceLine({
          price: tradeSetup.take_profit_2,
          color: colors.trading.takeProfit,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `TP2`,
        });
        tradingLinesRef.current.push(tp2Line);
      }

      // Dibujar Take Profit 3 si existe
      if (tradeSetup.take_profit_3) {
        const tp3Line = candlestickSeriesRef.current.createPriceLine({
          price: tradeSetup.take_profit_3,
          color: colors.trading.takeProfit,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `TP3`,
        });
        tradingLinesRef.current.push(tp3Line);
      }

      console.log(`Dibujadas ${tradingLinesRef.current.length} líneas de trading setup`);
    }

  }, [analysisResult, showAiAnalysisDrawings, analysisOpacity]);

  // Update MAX/MIN labels
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || historicalData.length === 0) return;

    // Limpiar etiquetas MAX/MIN anteriores
    if (maxMinPriceLinesRef.current.max && candlestickSeriesRef.current) {
      try {
        candlestickSeriesRef.current.removePriceLine(maxMinPriceLinesRef.current.max);
      } catch (error) {
        console.warn('Error removing max price line:', error);
      }
      maxMinPriceLinesRef.current.max = null;
    }
    if (maxMinPriceLinesRef.current.min && candlestickSeriesRef.current) {
      try {
        candlestickSeriesRef.current.removePriceLine(maxMinPriceLinesRef.current.min);
      } catch (error) {
        console.warn('Error removing min price line:', error);
      }
      maxMinPriceLinesRef.current.min = null;
    }

    // Agregar nuevas etiquetas MAX/MIN si están habilitadas
    if (showMaxMinLabels && candlestickSeriesRef.current) {
      const maxPrice = Math.max(...historicalData.map(d => d.high));
      const minPrice = Math.min(...historicalData.map(d => d.low));

      const colorWithOpacity = maxMinColor + Math.round(maxMinOpacity * 255).toString(16).padStart(2, '0');

      // Etiqueta MAX (sin línea en el gráfico)
      const maxLine = candlestickSeriesRef.current.createPriceLine({
        price: maxPrice,
        color: colorWithOpacity,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'MAX',
      });
      maxMinPriceLinesRef.current.max = maxLine;

      // Etiqueta MIN (sin línea en el gráfico)
      const minLine = candlestickSeriesRef.current.createPriceLine({
        price: minPrice,
        color: colorWithOpacity,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'MIN',
      });
      maxMinPriceLinesRef.current.min = minLine;

      console.log(`Etiquetas MAX/MIN agregadas: MAX=${maxPrice.toFixed(4)}, MIN=${minPrice.toFixed(4)}`);
    }
  }, [historicalData, showMaxMinLabels, maxMinOpacity, maxMinColor]);

  // Dibujar camino probable del precio (proyección visual)
  useEffect(() => {
    // Limpiar serie anterior del camino probable
    if (pricePathSeriesRef.current && chartRef.current) {
      try {
        chartRef.current.removeSeries(pricePathSeriesRef.current);
        pricePathSeriesRef.current = null;
      } catch (error) {
        console.warn('Error removing price path series:', error);
      }
    }

    // Dibujar nuevo camino probable si está habilitado y hay datos
    if (showPricePath && analysisResult && analysisResult.proyeccion_precio_visual &&
      analysisResult.proyeccion_precio_visual.camino_probable_1 &&
      analysisResult.proyeccion_precio_visual.camino_probable_1.length > 1 &&
      chartRef.current && historicalData.length > 0) {

      const caminoProbable = analysisResult.proyeccion_precio_visual.camino_probable_1;

      // Obtener el último timestamp de los datos históricos
      const lastTimestamp = historicalData[historicalData.length - 1].time;

      // Crear datos de línea para el camino probable
      // Distribuimos los puntos del camino en el tiempo futuro
      const timeStep = 900; // 15 minutos en segundos (ajustar según timeframe)
      const pricePathData: LineData[] = caminoProbable.map((price, index) => ({
        time: (lastTimestamp + (index * timeStep)) as UTCTimestamp,
        value: price
      }));

      // Configurar la serie de línea para el camino probable
      const lineOptions: DeepPartial<LineSeriesOptions> = {
        color: '#60A5FA', // Azul claro
        lineWidth: 2,
        lineStyle: LineStyle.Dashed, // Línea discontinua
        title: '', // Sin título
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#60A5FA',
        crosshairMarkerBackgroundColor: '#60A5FA'
      };

      try {
        const pricePathSeries = chartRef.current.addLineSeries(lineOptions);
        pricePathSeries.setData(pricePathData);
        pricePathSeriesRef.current = pricePathSeries;

        console.log(`Camino probable dibujado con ${pricePathData.length} puntos:`,
          pricePathData.map(p => `${p.value.toFixed(2)}`).join(' → '));
      } catch (error) {
        console.warn('Error adding price path series:', error);
      }
    }
  }, [showPricePath, analysisResult, historicalData]);

  // Status indicator
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'ok': return '#22C55E';
      case 'error': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={chartContainerRef}
        style={{ width: '100%', height: '100%' }}
      />

      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        padding: '4px 8px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getStatusColor()
          }}
        />
        {connectionStatus === 'connecting' && 'Conectando...'}
        {connectionStatus === 'ok' && 'Conectado'}
        {connectionStatus === 'error' && 'Error de conexión'}
      </div>

      {/* Botón de auto-fit (lupa) */}
      <button
        onClick={handleAutoFit}
        title="Auto-ajustar gráfico"
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          width: '36px',
          height: '36px',
          backgroundColor: autoFitEnabled ? 'rgba(34, 197, 94, 0.8)' : 'rgba(0, 0, 0, 0.7)',
          border: 'none',
          borderRadius: '6px',
          color: autoFitEnabled ? '#ffffff' : '#D1D5DB',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          transition: 'all 0.2s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          if (!autoFitEnabled) {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          }
        }}
        onMouseLeave={(e) => {
          if (!autoFitEnabled) {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          }
        }}
      >
        🔍
      </button>
    </div>
  );
};

// Exportar también el RSIPanel para uso independiente
export { RSIPanel };
export default RealTimeTradingChart;