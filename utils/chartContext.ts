/**
 * Utilidades para generar contexto del gráfico para el chat IA
 */
import { GeminiAnalysisResult, MovingAverageConfig } from '../types';

export interface ChartContextData {
    historicalDataLength: number;
    priceRange: { min: number; max: number };
    recentPriceAction: string;
    volumeAnalysis: string;
}

/**
 * Genera un resumen de los datos históricos para el contexto del chat
 */
export function generateHistoricalDataSummary(
    historicalData: Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>,
    timeframe: string
): string {
    if (!historicalData || historicalData.length === 0) {
        return "Sin datos históricos disponibles";
    }

    const dataLength = historicalData.length;
    const latest = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];

    // Calcular rango de precios
    const prices = historicalData.map(d => [d.high, d.low]).flat();
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Análisis de acción del precio reciente
    let priceAction = "precio estable";
    if (latest && previous) {
        const priceChange = ((latest.close - previous.close) / previous.close) * 100;
        if (priceChange > 2) priceAction = "fuerte impulso alcista";
        else if (priceChange > 0.5) priceAction = "movimiento alcista";
        else if (priceChange < -2) priceAction = "fuerte caída";
        else if (priceChange < -0.5) priceAction = "movimiento bajista";
    }

    // Análisis básico de volumen
    let volumeAnalysis = "volumen no disponible";
    if (historicalData.some(d => d.volume && d.volume > 0)) {
        const recentVolumes = historicalData.slice(-10).map(d => d.volume || 0);
        const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
        const latestVolume = latest.volume || 0;

        if (latestVolume > avgVolume * 1.5) volumeAnalysis = "volumen elevado";
        else if (latestVolume < avgVolume * 0.7) volumeAnalysis = "volumen bajo";
        else volumeAnalysis = "volumen normal";
    }

    return `${dataLength} velas en ${timeframe}, rango $${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}, ${priceAction}, ${volumeAnalysis}`;
}

/**
 * Genera resumen del estado de las medias móviles
 */
export function generateMovingAveragesSummary(movingAverages: MovingAverageConfig[]): string {
    const visibleMAs = movingAverages.filter(ma => ma.visible);

    if (visibleMAs.length === 0) {
        return "Sin medias móviles activas";
    }

    return visibleMAs.map(ma => `${ma.type}${ma.period}`).join(', ');
}

/**
 * Genera un resumen de los elementos visuales activos en el gráfico
 */
export function generateVisualElementsSummary(
    showAiAnalysisDrawings: boolean,
    showWSignals: boolean,
    analysisResult: GeminiAnalysisResult | null
): string {
    const elements: string[] = [];

    if (showAiAnalysisDrawings && analysisResult) {
        const pointsCount = analysisResult.puntos_clave_grafico?.length || 0;
        if (pointsCount > 0) {
            elements.push(`${pointsCount} niveles/zonas del análisis IA`);
        }
    }

    if (showWSignals) {
        elements.push("señales W visibles");
    }

    if (elements.length === 0) {
        return "solo velas y precio";
    }

    return elements.join(', ');
}

/**
 * Extrae los niveles más importantes del análisis para el contexto
 */
export function extractKeyLevelsForContext(analysisResult: GeminiAnalysisResult | null): string {
    if (!analysisResult || !analysisResult.puntos_clave_grafico) {
        return "Sin niveles identificados";
    }

    const importantLevels = analysisResult.puntos_clave_grafico
        .filter(point => point.importancia === 'alta')
        .slice(0, 3)
        .map(point => {
            const levelText = point.zona
                ? `$${point.zona[0].toFixed(2)}-$${point.zona[1].toFixed(2)}`
                : point.nivel ? `$${point.nivel.toFixed(2)}` : '';
            return `${point.label} (${levelText})`;
        });

    return importantLevels.length > 0
        ? importantLevels.join(', ')
        : "Niveles identificados pero sin importancia alta especificada";
}
