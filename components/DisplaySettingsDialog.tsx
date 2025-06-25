import React, { useState } from 'react';
import { MovingAverageConfig } from '../types';
import MovingAverageControls from './MovingAverageControls';

// Componente reutilizable para secciones colapsables
interface CollapsibleSectionProps {
    title: string;
    icon: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    theme: 'dark' | 'light';
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    isOpen,
    onToggle,
    children,
    theme
}) => {
    const buttonBgColor = theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100';
    const sectionBorderColor = theme === 'dark' ? 'border-slate-600' : 'border-gray-300';
    const contentBorderColor = theme === 'dark' ? 'border-slate-600' : 'border-gray-200';

    return (
        <div className={`border ${sectionBorderColor} rounded-lg overflow-hidden bg-opacity-50`}>
            <button
                onClick={onToggle}
                className={`w-full p-3 text-left ${buttonBgColor} transition-all duration-200 flex items-center justify-between`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <span className="font-medium text-sm">{title}</span>
                </div>
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className={`p-3 border-t ${contentBorderColor} bg-opacity-30`}>
                    {children}
                </div>
            )}
        </div>
    );
};

interface DisplaySettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'dark' | 'light';
    movingAverages: MovingAverageConfig[];
    setMovingAverages: (configs: MovingAverageConfig[]) => void;
    chartPaneBackgroundColor: string;
    setChartPaneBackgroundColor: (color: string) => void;
    volumePaneHeight: number;
    setVolumePaneHeight: (height: number) => void;
    wSignalColor: string;
    setWSignalColor: (color: string) => void;
    wSignalOpacity: number;
    setWSignalOpacity: (opacity: number) => void;
    showWSignals: boolean;
    setShowWSignals: (show: boolean) => void;

    // Propiedades para controles avanzados de indicadores
    showMovingAverages: boolean;
    onMovingAveragesToggle: (show: boolean) => void;
    maOpacity: number;
    onMaOpacityChange: (opacity: number) => void;
    showAiAnalysisDrawings: boolean;
    onAnalysisDrawingsToggle: (show: boolean) => void;
    analysisOpacity: number;
    onAnalysisOpacityChange: (opacity: number) => void;
    showMaxMinLabels: boolean;
    onMaxMinLabelsToggle: (show: boolean) => void;
    maxMinOpacity: number;
    onMaxMinOpacityChange: (opacity: number) => void;
    maxMinColor: string;
    onMaxMinColorChange: (color: string) => void;

    // Nueva prop para las etiquetas de MA en la escala de precios
    showMaLabelsOnPriceScale: boolean;
    onMaLabelsOnPriceScaleToggle: (show: boolean) => void;

    // RSI props
    showRSI: boolean;
    onRSIToggle: (show: boolean) => void;
    rsiPeriod: number;
    onRSIPeriodChange: (period: number) => void;
    rsiHeight: number;
    onRSIHeightChange: (height: number) => void;
    rsiOverboughtLevel: number;
    onRSIOverboughtLevelChange: (level: number) => void;
    rsiOversoldLevel: number;
    onRSIOversoldLevelChange: (level: number) => void;
    rsiLevel80: boolean;
    onRSILevel80Toggle: (show: boolean) => void;
    rsiLevel20: boolean;
    onRSILevel20Toggle: (show: boolean) => void;
    rsiColor: string;
    onRSIColorChange: (color: string) => void;
    rsiOverboughtColor: string;
    onRSIOverboughtColorChange: (color: string) => void;
    rsiOversoldColor: string;
    onRSIOversoldColorChange: (color: string) => void;
    rsiBackgroundColor: string;
    onRSIBackgroundColorChange: (color: string) => void;
}

const DisplaySettingsDialog: React.FC<DisplaySettingsDialogProps> = ({
    isOpen,
    onClose,
    theme,
    movingAverages,
    setMovingAverages,
    chartPaneBackgroundColor,
    setChartPaneBackgroundColor,
    volumePaneHeight,
    setVolumePaneHeight,
    wSignalColor,
    setWSignalColor,
    wSignalOpacity,
    setWSignalOpacity,
    showWSignals,
    setShowWSignals,
    showMovingAverages,
    onMovingAveragesToggle,
    maOpacity,
    onMaOpacityChange,
    showAiAnalysisDrawings,
    onAnalysisDrawingsToggle,
    analysisOpacity,
    onAnalysisOpacityChange,
    showMaxMinLabels,
    onMaxMinLabelsToggle,
    maxMinOpacity,
    onMaxMinOpacityChange,
    maxMinColor,
    onMaxMinColorChange,
    showMaLabelsOnPriceScale,
    onMaLabelsOnPriceScaleToggle,
    // RSI props
    showRSI,
    onRSIToggle,
    rsiPeriod,
    onRSIPeriodChange,
    rsiHeight,
    onRSIHeightChange,
    rsiOverboughtLevel,
    onRSIOverboughtLevelChange,
    rsiOversoldLevel,
    onRSIOversoldLevelChange,
    rsiLevel80,
    onRSILevel80Toggle,
    rsiLevel20,
    onRSILevel20Toggle,
    rsiColor,
    onRSIColorChange,
    rsiOverboughtColor,
    onRSIOverboughtColorChange,
    rsiOversoldColor,
    onRSIOversoldColorChange,
    rsiBackgroundColor,
    onRSIBackgroundColorChange,
}) => {
    // Estados para las secciones colapsables
    const [indicatorsOpen, setIndicatorsOpen] = useState(true); // Sección principal de indicadores
    const [movingAveragesOpen, setMovingAveragesOpen] = useState(false); // Subsección de medias móviles
    const [analysisDrawingsOpen, setAnalysisDrawingsOpen] = useState(false);
    const [maxMinLabelsOpen, setMaxMinLabelsOpen] = useState(false);
    const [chartStyleOpen, setChartStyleOpen] = useState(false);
    const [wSignalsOpen, setWSignalsOpen] = useState(false);
    const [rsiOpen, setRsiOpen] = useState(false); // RSI section

    if (!isOpen) {
        return null;
    }

    const dialogBgColor = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const textColor = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
    const sectionBorderColor = theme === 'dark' ? 'border-slate-700' : 'border-gray-300';
    const labelColor = theme === 'dark' ? 'text-slate-300' : 'text-slate-700';

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="display-settings-dialog-title"
        >
            <div
                className={`flex flex-col w-full max-w-md shadow-xl rounded-lg ${dialogBgColor} ${textColor}`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className={`p-3 sm:p-4 border-b ${sectionBorderColor} flex justify-between items-center flex-shrink-0`}>
                    <h2 id="display-settings-dialog-title" className="text-md sm:text-lg font-semibold text-sky-400">Configuración de Visualización</h2>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-md ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                        aria-label="Cerrar diálogo de configuración"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-grow p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto max-h-[70vh]">
                    {/* Sección Principal: Indicadores */}
                    <CollapsibleSection
                        title="Indicadores"
                        icon="📊"
                        isOpen={indicatorsOpen}
                        onToggle={() => setIndicatorsOpen(!indicatorsOpen)}
                        theme={theme}
                    >
                        <div className="space-y-3">
                            {/* Subsección: Medias Móviles */}
                            <CollapsibleSection
                                title="Medias Móviles"
                                icon="📈"
                                isOpen={movingAveragesOpen}
                                onToggle={() => setMovingAveragesOpen(!movingAveragesOpen)}
                                theme={theme}
                            >
                                <div className="mb-3">
                                    <label htmlFor="toggle-show-mas-dialog" className={`flex items-center cursor-pointer text-xs sm:text-sm ${labelColor}`}>
                                        <input
                                            type="checkbox"
                                            id="toggle-show-mas-dialog"
                                            checked={showMovingAverages}
                                            onChange={(e) => onMovingAveragesToggle(e.target.checked)}
                                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 mr-2"
                                        />
                                        Mostrar Medias Móviles
                                    </label>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="ma-opacity-slider-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                        Opacidad Medias Móviles: {Math.round(maOpacity * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        id="ma-opacity-slider-dialog"
                                        min="0" max="1" step="0.01"
                                        value={maOpacity}
                                        onChange={(e) => onMaOpacityChange(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                </div>

                                {/* Toggle para mostrar/ocultar etiquetas en la escala de precios */}
                                <div className="mb-3">
                                    <label htmlFor="toggle-ma-labels-dialog" className={`flex items-center cursor-pointer text-xs sm:text-sm ${labelColor}`}>
                                        <input
                                            type="checkbox"
                                            id="toggle-ma-labels-dialog"
                                            checked={showMaLabelsOnPriceScale}
                                            onChange={(e) => onMaLabelsOnPriceScaleToggle(e.target.checked)}
                                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 mr-2"
                                        />
                                        Mostrar Etiquetas en Escala de Precios
                                    </label>
                                </div>

                                <MovingAverageControls
                                    movingAverages={movingAverages}
                                    setMovingAverages={setMovingAverages}
                                />
                            </CollapsibleSection>

                            {/* Subsección: Análisis IA */}
                            <CollapsibleSection
                                title="Análisis IA"
                                icon="🧠"
                                isOpen={analysisDrawingsOpen}
                                onToggle={() => setAnalysisDrawingsOpen(!analysisDrawingsOpen)}
                                theme={theme}
                            >
                                <div className="mb-3">
                                    <label htmlFor="toggle-analysis-drawings-dialog" className={`flex items-center cursor-pointer text-xs sm:text-sm ${labelColor}`}>
                                        <input
                                            type="checkbox"
                                            id="toggle-analysis-drawings-dialog"
                                            checked={showAiAnalysisDrawings}
                                            onChange={(e) => onAnalysisDrawingsToggle(e.target.checked)}
                                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 mr-2"
                                        />
                                        Mostrar Dibujos del Análisis IA
                                    </label>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="analysis-opacity-slider-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                        Opacidad Líneas de Análisis: {Math.round(analysisOpacity * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        id="analysis-opacity-slider-dialog"
                                        min="0" max="1" step="0.01"
                                        value={analysisOpacity}
                                        onChange={(e) => onAnalysisOpacityChange(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                    />
                                </div>

                                {/* Aquí podríamos agregar controles específicos para colores de FVG, OB, BSL, etc. */}
                                <div className="mt-3 p-2 bg-blue-900 bg-opacity-20 rounded text-xs">
                                    <strong>Colores por categoría:</strong><br />
                                    • FVG: Verde/Rojo según dirección<br />
                                    • OB: Azul/Naranja según tipo<br />
                                    • BSL: Púrpura<br />
                                    • Entradas: Verde (Long) / Rojo (Short)<br />
                                    • TP/SL: Amarillo/Rojo
                                </div>
                            </CollapsibleSection>
                        </div>
                    </CollapsibleSection>

                    {/* Sección Etiquetas MAX/MIN */}
                    <CollapsibleSection
                        title="Etiquetas MAX/MIN"
                        icon="🏷️"
                        isOpen={maxMinLabelsOpen}
                        onToggle={() => setMaxMinLabelsOpen(!maxMinLabelsOpen)}
                        theme={theme}
                    >
                        <div className="mb-3">
                            <label htmlFor="toggle-max-min-labels-dialog" className={`flex items-center cursor-pointer text-xs sm:text-sm ${labelColor}`}>
                                <input
                                    type="checkbox"
                                    id="toggle-max-min-labels-dialog"
                                    checked={showMaxMinLabels}
                                    onChange={(e) => onMaxMinLabelsToggle(e.target.checked)}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 mr-2"
                                />
                                Mostrar Etiquetas MAX/MIN
                            </label>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="max-min-opacity-slider-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Opacidad Etiquetas: {Math.round(maxMinOpacity * 100)}%
                            </label>
                            <input
                                type="range"
                                id="max-min-opacity-slider-dialog"
                                min="0" max="1" step="0.01"
                                value={maxMinOpacity}
                                onChange={(e) => onMaxMinOpacityChange(Number(e.target.value))}
                                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="max-min-color-picker-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>Color Etiquetas MAX/MIN</label>
                            <input
                                type="color"
                                id="max-min-color-picker-dialog"
                                value={maxMinColor}
                                onChange={(e) => onMaxMinColorChange(e.target.value)}
                                className={`w-full h-7 sm:h-8 p-0 border-none rounded cursor-pointer ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'}`}
                            />
                        </div>
                    </CollapsibleSection>

                    {/* Sección Estilo del Gráfico */}
                    <CollapsibleSection
                        title="Estilo del Gráfico"
                        icon="🎨"
                        isOpen={chartStyleOpen}
                        onToggle={() => setChartStyleOpen(!chartStyleOpen)}
                        theme={theme}
                    >
                        <div className="mb-3">
                            <label htmlFor="chart-bg-color-picker-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>Color de Fondo del Gráfico</label>
                            <input
                                type="color"
                                id="chart-bg-color-picker-dialog"
                                value={chartPaneBackgroundColor}
                                onChange={(e) => setChartPaneBackgroundColor(e.target.value)}
                                className={`w-full h-7 sm:h-8 p-0 border-none rounded cursor-pointer ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'}`}
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="volume-pane-height-slider-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Altura Panel de Volumen: {volumePaneHeight > 0 ? `${volumePaneHeight}px` : 'Oculto'}
                            </label>
                            <input
                                type="range"
                                id="volume-pane-height-slider-dialog"
                                min="0" max="200" step="10"
                                value={volumePaneHeight}
                                onChange={(e) => setVolumePaneHeight(Number(e.target.value))}
                                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                        </div>
                    </CollapsibleSection>

                    {/* Sección Señales W */}
                    <CollapsibleSection
                        title="Señales W"
                        icon="🎯"
                        isOpen={wSignalsOpen}
                        onToggle={() => setWSignalsOpen(!wSignalsOpen)}
                        theme={theme}
                    >
                        <div className="mb-3">
                            <label htmlFor="toggle-w-signals-dialog" className={`flex items-center cursor-pointer text-xs sm:text-sm ${labelColor}`}>
                                <input
                                    type="checkbox"
                                    id="toggle-w-signals-dialog"
                                    checked={showWSignals}
                                    onChange={(e) => setShowWSignals(e.target.checked)}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 mr-2"
                                />
                                Mostrar Señales W
                            </label>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="w-signal-color-picker-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>Color Marcador Señal W</label>
                            <input
                                type="color"
                                id="w-signal-color-picker-dialog"
                                value={wSignalColor}
                                onChange={(e) => setWSignalColor(e.target.value)}
                                className={`w-full h-7 sm:h-8 p-0 border-none rounded cursor-pointer ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'}`}
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="w-signal-opacity-slider-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>Opacidad Marcador Señal W: {wSignalOpacity}%</label>
                            <input
                                type="range"
                                id="w-signal-opacity-slider-dialog"
                                min="0" max="100" step="1"
                                value={wSignalOpacity}
                                onChange={(e) => setWSignalOpacity(Number(e.target.value))}
                                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                        </div>
                    </CollapsibleSection>

                    {/* Sección RSI */}
                    <CollapsibleSection
                        title="RSI"
                        icon="📊"
                        isOpen={rsiOpen}
                        onToggle={() => setRsiOpen(!rsiOpen)}
                        theme={theme}
                    >
                        <div className="mb-3">
                            <label htmlFor="toggle-rsi-dialog" className={`flex items-center cursor-pointer text-xs sm:text-sm ${labelColor}`}>
                                <input
                                    type="checkbox"
                                    id="toggle-rsi-dialog"
                                    checked={showRSI}
                                    onChange={(e) => onRSIToggle(e.target.checked)}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 mr-2"
                                />
                                Mostrar RSI
                            </label>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="rsi-period-input-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Periodo RSI: {rsiPeriod}
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="range"
                                    id="rsi-period-input-dialog"
                                    min="2" max="50" step="1"
                                    value={rsiPeriod}
                                    onChange={(e) => onRSIPeriodChange(Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                />
                                <input
                                    type="number"
                                    min="2" max="50"
                                    value={rsiPeriod}
                                    onChange={(e) => onRSIPeriodChange(Number(e.target.value))}
                                    className={`w-16 px-2 py-1 text-xs rounded border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="rsi-height-input-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Altura Panel RSI: {rsiHeight}px
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="range"
                                    id="rsi-height-input-dialog"
                                    min="50" max="300" step="10"
                                    value={rsiHeight}
                                    onChange={(e) => onRSIHeightChange(Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                />
                                <input
                                    type="number"
                                    min="50" max="300" step="10"
                                    value={rsiHeight}
                                    onChange={(e) => onRSIHeightChange(Number(e.target.value))}
                                    className={`w-16 px-2 py-1 text-xs rounded border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="rsi-overbought-input-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Nivel Sobrecompra: {rsiOverboughtLevel}
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="range"
                                    id="rsi-overbought-input-dialog"
                                    min="60" max="90" step="1"
                                    value={rsiOverboughtLevel}
                                    onChange={(e) => onRSIOverboughtLevelChange(Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                />
                                <input
                                    type="number"
                                    min="60" max="90"
                                    value={rsiOverboughtLevel}
                                    onChange={(e) => onRSIOverboughtLevelChange(Number(e.target.value))}
                                    className={`w-16 px-2 py-1 text-xs rounded border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="rsi-oversold-input-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Nivel Sobreventa: {rsiOversoldLevel}
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="range"
                                    id="rsi-oversold-input-dialog"
                                    min="10" max="40" step="1"
                                    value={rsiOversoldLevel}
                                    onChange={(e) => onRSIOversoldLevelChange(Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                />
                                <input
                                    type="number"
                                    min="10" max="40"
                                    value={rsiOversoldLevel}
                                    onChange={(e) => onRSIOversoldLevelChange(Number(e.target.value))}
                                    className={`w-16 px-2 py-1 text-xs rounded border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                                />
                            </div>
                        </div>

                        {/* Colores del RSI */}
                        <div className="mb-3">
                            <label htmlFor="rsi-color-input-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Color RSI
                            </label>
                            <input
                                type="color"
                                id="rsi-color-input-dialog"
                                value={rsiColor}
                                onChange={(e) => onRSIColorChange(e.target.value)}
                                className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="rsi-overbought-color-input-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Color Sobrecompra
                            </label>
                            <input
                                type="color"
                                id="rsi-overbought-color-input-dialog"
                                value={rsiOverboughtColor.includes('rgba') ? '#ef4444' : rsiOverboughtColor}
                                onChange={(e) => onRSIOverboughtColorChange(`rgba(${parseInt(e.target.value.slice(1,3), 16)}, ${parseInt(e.target.value.slice(3,5), 16)}, ${parseInt(e.target.value.slice(5,7), 16)}, 0.8)`)}
                                className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="rsi-oversold-color-input-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Color Sobreventa
                            </label>
                            <input
                                type="color"
                                id="rsi-oversold-color-input-dialog"
                                value={rsiOversoldColor.includes('rgba') ? '#22c55e' : rsiOversoldColor}
                                onChange={(e) => onRSIOversoldColorChange(`rgba(${parseInt(e.target.value.slice(1,3), 16)}, ${parseInt(e.target.value.slice(3,5), 16)}, ${parseInt(e.target.value.slice(5,7), 16)}, 0.8)`)}
                                className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="rsi-background-color-input-dialog" className={`block mb-1 text-xs sm:text-sm font-medium ${labelColor}`}>
                                Color Fondo RSI
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    id="rsi-background-color-input-dialog"
                                    value={rsiBackgroundColor === 'transparent' ? '#18191B' : rsiBackgroundColor}
                                    onChange={(e) => onRSIBackgroundColorChange(e.target.value)}
                                    className="flex-1 h-8 rounded border border-slate-300 cursor-pointer"
                                />
                                <button
                                    onClick={() => onRSIBackgroundColorChange('transparent')}
                                    className={`px-3 py-1 text-xs rounded border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' : 'bg-white border-gray-300 text-black hover:bg-gray-100'}`}
                                >
                                    Transparente
                                </button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="toggle-rsi-level-80-dialog" className={`flex items-center cursor-pointer text-xs sm:text-sm ${labelColor}`}>
                                <input
                                    type="checkbox"
                                    id="toggle-rsi-level-80-dialog"
                                    checked={rsiLevel80}
                                    onChange={(e) => onRSILevel80Toggle(e.target.checked)}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 mr-2"
                                />
                                Mostrar Nivel 80
                            </label>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="toggle-rsi-level-20-dialog" className={`flex items-center cursor-pointer text-xs sm:text-sm ${labelColor}`}>
                                <input
                                    type="checkbox"
                                    id="toggle-rsi-level-20-dialog"
                                    checked={rsiLevel20}
                                    onChange={(e) => onRSILevel20Toggle(e.target.checked)}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 dark:focus:ring-sky-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 mr-2"
                                />
                                Mostrar Nivel 20
                            </label>
                        </div>
                    </CollapsibleSection>
                </div>
            </div>
        </div>
    );
};

export default DisplaySettingsDialog;
