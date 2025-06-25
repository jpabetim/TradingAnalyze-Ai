import React, { useEffect, useRef } from 'react';
import {
  createChart, IChartApi, ISeriesApi,
  LineData as LWCLineData, LineStyle, UTCTimestamp,
  DeepPartial, ChartOptions, LineSeriesOptions, IPriceLine, ColorType
} from 'lightweight-charts';

type Theme = 'dark' | 'light';
type LineData = LWCLineData<UTCTimestamp>;

interface CandlestickData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface RSIPanelProps {
  data: CandlestickData[];
  theme: Theme;
  height: number;
  period: number;
  overboughtLevel: number;
  oversoldLevel: number;
  showLevel80: boolean;
  showLevel20: boolean;
  rsiColor?: string;
  overboughtColor?: string;
  oversoldColor?: string;
  backgroundColor?: string;
  mainChartRef?: React.RefObject<IChartApi | null>; // Nueva prop para sincronización
  currentTimezone?: { name: string; zone: string }; // Zona horaria actual
  onTimezoneChange?: () => void; // Función para cambiar zona horaria
}

// Función para calcular RSI
const calculateRSI = (data: CandlestickData[], period: number = 14): LineData[] => {
  if (data.length < period + 1) return [];

  const results: LineData[] = [];
  let gains = 0;
  let losses = 0;

  // Calcular ganancias y pérdidas iniciales
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));

  results.push({ time: data[period].time, value: rsi });

  // Calcular RSI para el resto de los datos
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;

    rs = avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));

    results.push({ time: data[i].time, value: rsi });
  }

  return results;
};

const RSIPanel: React.FC<RSIPanelProps> = ({
  data,
  theme,
  height,
  period,
  overboughtLevel,
  oversoldLevel,
  showLevel80,
  showLevel20,
  rsiColor = '#FFFFFF', // Cambiado a blanco por defecto
  overboughtColor = 'rgba(156, 163, 175, 0.8)', // Gris claro
  oversoldColor = 'rgba(156, 163, 175, 0.8)', // Gris claro
  backgroundColor = 'transparent',
  mainChartRef, // Nueva prop para sincronización
  currentTimezone, // Zona horaria actual
  onTimezoneChange // Función para cambiar zona horaria
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Handle resize function
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    rsiSeriesRef.current = null;
    priceLinesRef.current = [];

    // Create chart options
    const chartOptions: DeepPartial<ChartOptions> = {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: {
          type: ColorType.Solid,
          color: backgroundColor === 'transparent' || !backgroundColor ?
            (theme === 'dark' ? '#18191B' : '#FFFFFF') : backgroundColor
        },
        textColor: theme === 'dark' ? '#D1D5DB' : '#374151',
      },
      grid: {
        vertLines: {
          color: theme === 'dark' ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.2)',
        },
        horzLines: {
          color: theme === 'dark' ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.2)',
        },
      },
      rightPriceScale: {
        visible: false, // Ocultar escala de precios/etiquetas
        borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        visible: true,
        borderColor: theme === 'dark' ? '#4B5563' : '#D1D5DB',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
          width: 1,
          style: LineStyle.Dashed,
        },
      },
    };

    // Create chart
    chartRef.current = createChart(chartContainerRef.current, chartOptions);

    // Calculate RSI data
    const rsiData = calculateRSI(data, period);
    if (rsiData.length === 0) {
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }

    // Create RSI series
    const rsiOptions: DeepPartial<LineSeriesOptions> = {
      color: rsiColor,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      title: `RSI(${period})`,
    };

    rsiSeriesRef.current = chartRef.current.addLineSeries(rsiOptions);
    rsiSeriesRef.current.setData(rsiData);

    // Add level lines (sin etiquetas visibles)
    if (rsiSeriesRef.current) {
      // Overbought level - gris claro continua
      const overboughtLine = rsiSeriesRef.current.createPriceLine({
        price: overboughtLevel,
        color: 'rgba(156, 163, 175, 0.8)', // Gris claro
        lineWidth: 1,
        lineStyle: LineStyle.Solid, // Continua
        axisLabelVisible: false, // Sin etiqueta
        title: '',
      });
      priceLinesRef.current.push(overboughtLine);

      // Oversold level - gris claro continua
      const oversoldLine = rsiSeriesRef.current.createPriceLine({
        price: oversoldLevel,
        color: 'rgba(156, 163, 175, 0.8)', // Gris claro
        lineWidth: 1,
        lineStyle: LineStyle.Solid, // Continua
        axisLabelVisible: false, // Sin etiqueta
        title: '',
      });
      priceLinesRef.current.push(oversoldLine);

      // Midline 50 - gris claro discontinua
      const midline = rsiSeriesRef.current.createPriceLine({
        price: 50,
        color: 'rgba(156, 163, 175, 0.6)', // Gris claro
        lineWidth: 1,
        lineStyle: LineStyle.Dashed, // Discontinua
        axisLabelVisible: false, // Sin etiqueta
        title: '',
      });
      priceLinesRef.current.push(midline);

      // Optional level 80
      if (showLevel80) {
        const level80 = rsiSeriesRef.current.createPriceLine({
          price: 80,
          color: overboughtColor.replace(/0\.\d+\)$/, '0.5)'),
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: false, // Sin etiqueta
          title: '',
        });
        priceLinesRef.current.push(level80);
      }

      // Optional level 20
      if (showLevel20) {
        const level20 = rsiSeriesRef.current.createPriceLine({
          price: 20,
          color: oversoldColor.replace(/0\.\d+\)$/, '0.5)'),
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: false, // Sin etiqueta
          title: '',
        });
        priceLinesRef.current.push(level20);
      }
    }

    // Fit content
    chartRef.current.timeScale().fitContent();

    // Setup improved sync from main chart to RSI
    let syncCleanup: (() => void) | null = null;

    if (mainChartRef?.current && chartRef.current) {
      const mainTimeScale = mainChartRef.current.timeScale();
      const rsiTimeScale = chartRef.current.timeScale();
      let isSyncing = false;

      // Improved sync function
      let syncTimeout: NodeJS.Timeout | null = null;
      const syncFromMainToRSI = () => {
        if (syncTimeout) clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          if (isSyncing || !mainChartRef?.current || !chartRef.current) return;

          try {
            isSyncing = true;
            const mainVisibleRange = mainTimeScale.getVisibleRange();
            if (mainVisibleRange) {
              // Sync the visible range to keep charts aligned
              rsiTimeScale.setVisibleRange(mainVisibleRange);
            }
          } catch (e) {
            // Ignore sync errors
            console.warn('RSI sync error:', e);
          } finally {
            isSyncing = false;
          }
        }, 50); // Faster sync response
      };

      // Subscribe to main chart changes
      mainTimeScale.subscribeVisibleTimeRangeChange(syncFromMainToRSI);

      // Initial sync with better timing
      setTimeout(() => {
        try {
          const mainRange = mainTimeScale.getVisibleRange();
          if (mainRange && chartRef.current) {
            chartRef.current.timeScale().setVisibleRange(mainRange);
          }
        } catch (e) {
          console.warn('Initial RSI sync error:', e);
        }
      }, 100);

      // Secondary sync to ensure alignment
      setTimeout(() => {
        syncFromMainToRSI();
      }, 500);

      // Cleanup function for sync
      syncCleanup = () => {
        if (syncTimeout) clearTimeout(syncTimeout);
        try {
          if (mainChartRef?.current) {
            mainTimeScale.unsubscribeVisibleTimeRangeChange(syncFromMainToRSI);
          }
        } catch (e) {
          console.warn('RSI sync cleanup error:', e);
      // Cleanup function for sync
      syncCleanup = () => {
        if (syncTimeout) clearTimeout(syncTimeout);
        try {
          if (mainChartRef?.current) {
            mainTimeScale.unsubscribeVisibleTimeRangeChange(syncFromMainToRSI);
          }
        } catch (e) {
          console.warn('RSI sync cleanup error:', e);
        }
      };
    }

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Fix timezone change functionality (double click handler)
    let timezoneEventCleanup: (() => void) | null = null;

    if (onTimezoneChange) {
      const setupTimezoneHandler = () => {
        if (!chartContainerRef.current) return;

        // Multiple attempts to find the time scale element
        const findTimeScaleElement = () => {
          const selectors = [
            '.tv-lightweight-charts__time-scale',
            '.tv-lightweight-charts [role="table"]',
            '.tv-lightweight-charts table'
          ];

          for (const selector of selectors) {
            const element = chartContainerRef.current?.querySelector(selector);
            if (element) return element;
          }
          return null;
        };

        let timeScaleElement = findTimeScaleElement();
        let attempts = 0;
        const maxAttempts = 10;

        const trySetupHandler = () => {
          timeScaleElement = findTimeScaleElement();

          if (timeScaleElement) {
            const handleTimezoneDoubleClick = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              onTimezoneChange();
            };

            // Add event listener with capture to ensure it's caught
            timeScaleElement.addEventListener('dblclick', handleTimezoneDoubleClick, { capture: true });

            // Also add click handler to entire chart container as fallback
            const handleContainerDoubleClick = (e: MouseEvent) => {
              // Only trigger if clicking in the time scale area (bottom portion)
              const rect = chartContainerRef.current?.getBoundingClientRect();
              if (rect && e.clientY > rect.bottom - 30) {
                e.preventDefault();
                e.stopPropagation();
                onTimezoneChange();
              }
            };

            chartContainerRef.current?.addEventListener('dblclick', handleContainerDoubleClick);

            // Setup cleanup
            timezoneEventCleanup = () => {
              timeScaleElement?.removeEventListener('dblclick', handleTimezoneDoubleClick, { capture: true });
              chartContainerRef.current?.removeEventListener('dblclick', handleContainerDoubleClick);
            };
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(trySetupHandler, 200);
          }
        };

        // Start trying to setup handler
        setTimeout(trySetupHandler, 100);
      };

      setupTimezoneHandler();
    }

    return () => {
      // Cleanup sync
      if (syncCleanup) syncCleanup();

      // Cleanup timezone event handlers
      if (timezoneEventCleanup) timezoneEventCleanup();

      // Cleanup resize listener
      window.removeEventListener('resize', handleResize);

      // Cleanup chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, theme, height, period, overboughtLevel, oversoldLevel, showLevel80, showLevel20, rsiColor, overboughtColor, oversoldColor, backgroundColor, mainChartRef, onTimezoneChange]);

  return (
    <div className="w-full">
      {/* Header del panel RSI */}
      <div className={`px-3 py-2 text-xs font-medium flex justify-between items-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
        <span>RSI ({period})</span>
        {currentTimezone && (
          <span className={`text-xs opacity-70 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {currentTimezone.name} - Doble clic para cambiar
          </span>
        )}
      </div>
      {/* Container del gráfico RSI */}
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
};

export default RSIPanel;
