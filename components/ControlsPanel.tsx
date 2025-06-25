import React from 'react';
import { DataSource } from '../types';
import { AnalysisPanelMode } from '../App';
import MultiAssetSymbolSelector from './MultiAssetSymbolSelector';

interface ControlsPanelProps {
  symbolInput: string;
  setSymbolInput: (symbol: string) => void;
  dataSource: DataSource;
  setDataSource: (dataSource: DataSource) => void;
  instrumentType: 'crypto' | 'forex' | 'commodities' | 'indices';
  setInstrumentType: (type: 'crypto' | 'forex' | 'commodities' | 'indices') => void;
  onRequestAnalysis: () => void;
  onRequestChat: () => void;
  isLoading: boolean;
  apiKeyPresent: boolean;
  isChartLoading: boolean;
  showAiAnalysisDrawings: boolean;
  setShowAiAnalysisDrawings: (show: boolean) => void;
  analysisPanelMode: AnalysisPanelMode;
  hasAnalysisResult: boolean;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  symbolInput,
  setSymbolInput,
  dataSource,
  setDataSource,
  instrumentType,
  setInstrumentType,
  onRequestAnalysis,
  onRequestChat,
  isLoading,
  apiKeyPresent,
  isChartLoading,
  showAiAnalysisDrawings,
  setShowAiAnalysisDrawings,
  analysisPanelMode,
  hasAnalysisResult,
}) => {

  const analysisButtonText =
    analysisPanelMode === 'analysis' && hasAnalysisResult
      ? 'Refrescar Análisis'
      : 'Análisis IA';

  return (
    <div className="p-2 sm:p-3 md:p-4 bg-slate-800 rounded-lg shadow">
      <h2 className="text-sm sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4 text-sky-400">Controles de Mercado</h2>

      <div className="mb-2 sm:mb-3 md:mb-4">
        <label className="block mb-1 sm:mb-2 text-xs font-medium text-slate-300">Configuración del Activo</label>
        <MultiAssetSymbolSelector
          symbol={symbolInput}
          dataSource={dataSource}
          instrumentType={instrumentType}
          onSymbolChange={setSymbolInput}
          onInstrumentTypeChange={setInstrumentType}
          onDataSourceChange={setDataSource}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-1.5 md:gap-2 mt-2 sm:mt-3 md:mt-4">
        <button
          onClick={() => setShowAiAnalysisDrawings(!showAiAnalysisDrawings)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg focus:outline-none focus:shadow-outline transition-colors text-xs sm:text-sm"
          aria-label="Alternar Dibujos en Gráfico"
        >
          <span className="sm:hidden">{showAiAnalysisDrawings ? '🙈 Dibujos' : '👁️ Dibujos'}</span>
          <span className="hidden sm:inline">{showAiAnalysisDrawings ? 'Ocultar Dibujos' : 'Mostrar Dibujos'}</span>
        </button>
        <button
          onClick={onRequestAnalysis}
          disabled={isLoading || isChartLoading || !apiKeyPresent}
          className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg focus:outline-none focus:shadow-outline transition-colors text-xs sm:text-sm"
          aria-label="Analizar Gráfico con IA"
        >
          <span className="sm:hidden">
            {isLoading && analysisPanelMode === 'analysis' ? '🔄 Analizando' : (isChartLoading ? '⏳ Cargando' : (analysisButtonText === 'Refrescar Análisis' ? '🔄 Refrescar' : '🧠 Análisis'))}
          </span>
          <span className="hidden sm:inline">
            {isLoading && analysisPanelMode === 'analysis' ? 'Analizando...' : (isChartLoading ? 'Cargando Gráfico...' : analysisButtonText)}
          </span>
        </button>
        <button
          onClick={onRequestChat}
          disabled={isLoading && analysisPanelMode === 'chat' || !apiKeyPresent}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-md sm:rounded-lg focus:outline-none focus:shadow-outline transition-colors text-xs sm:text-sm"
          aria-label="Abrir Asistente de Chat IA"
        >
          <span className="sm:hidden">
            {isLoading && analysisPanelMode === 'chat' ? '💬 Procesando' : '🤖 Asistente'}
          </span>
          <span className="hidden sm:inline">
            {isLoading && analysisPanelMode === 'chat' ? 'Procesando...' : 'Asistente IA'}
          </span>
        </button>
      </div>
      {!apiKeyPresent && <p className="text-xs text-yellow-400 mt-1 sm:mt-1.5 md:mt-2 text-center">Funciones IA deshabilitadas: Clave API no configurada.</p>}
    </div>
  );
};

export default ControlsPanel;
