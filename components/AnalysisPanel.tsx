

import React, { useRef, useEffect, useState } from 'react';
import { GeminiAnalysisResult, TradeSetup, AnalysisPointType, FibonacciAnalysis, FibonacciLevel } from '../types';
import { AnalysisPanelMode, ChatMessage } from '../App';

interface AnalysisPanelProps {
  panelMode: AnalysisPanelMode;
  analysisResult: GeminiAnalysisResult | null;
  analysisLoading: boolean;
  analysisError: string | null;
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  chatError: string | null;
  onSendMessage: (message: string) => void;
  onClearChatHistory: () => void; // Nueva prop
  theme: 'dark' | 'light';
  isMobile: boolean;
  apiKeyPresent: boolean;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-xs sm:text-sm md:text-md lg:text-lg font-semibold mt-2 sm:mt-3 md:mt-4 mb-1 sm:mb-1.5 md:mb-2 text-sky-400 border-b border-slate-700 pb-1">{children}</h3>
);

const DetailItem: React.FC<{ label: string; value?: string | number | null; isCode?: boolean; valueClassName?: string }> = ({ label, value, isCode = false, valueClassName = "" }) => (
  value || value === 0 ? (
    <p className="text-xs text-slate-300 break-words">
      <span className="font-medium text-slate-100">{label}:</span>{' '}
      {isCode ? <code className="text-xs bg-slate-600 p-0.5 sm:p-1 rounded break-all">{value}</code> : <span className={`${valueClassName} break-words`}>{value}</span>}
    </p>
  ) : null
);


const TradeSetupDisplay: React.FC<{ setup: TradeSetup | undefined, isMobile: boolean }> = ({ setup, isMobile }) => {
  if (!setup || setup.tipo === "ninguno") {
    return <p className="text-xs sm:text-sm text-slate-400 italic">No se identificó una configuración de trade específica.</p>;
  }
  return (
    <div className="space-y-1 mt-1 p-1.5 sm:p-2 md:p-3 bg-slate-700/50 rounded-md">
      <DetailItem label="Tipo" value={setup.tipo?.toUpperCase()} />
      {!isMobile && <DetailItem label="Condición" value={setup.descripcion_entrada} />}
      <DetailItem label="Entrada Ideal" value={setup.punto_entrada_ideal ? `$${setup.punto_entrada_ideal.toFixed(Math.abs(setup.punto_entrada_ideal) < 1 ? 4 : 2)}` : undefined} />
      {setup.zona_entrada && (
        <DetailItem 
          label={isMobile ? "Zona" : "Zona de Entrada"} 
          value={`[$${setup.zona_entrada[0].toFixed(Math.abs(setup.zona_entrada[0]) < 1 ? 4 : 2)} - $${setup.zona_entrada[1].toFixed(Math.abs(setup.zona_entrada[1]) < 1 ? 4 : 2)}]`} 
        />
      )}
      <DetailItem label="Stop Loss" value={setup.stop_loss ? `$${setup.stop_loss.toFixed(Math.abs(setup.stop_loss) < 1 ? 4 : 2)}` : undefined} />
      <DetailItem label="TP1" value={setup.take_profit_1 ? `$${setup.take_profit_1.toFixed(Math.abs(setup.take_profit_1) < 1 ? 4 : 2)}` : undefined} />
      {setup.take_profit_2 && <DetailItem label="TP2" value={`$${setup.take_profit_2.toFixed(Math.abs(setup.take_profit_2) < 1 ? 4 : 2)}`} />}
      {!isMobile && setup.take_profit_3 && <DetailItem label="TP3" value={`$${setup.take_profit_3.toFixed(Math.abs(setup.take_profit_3) < 1 ? 4 : 2)}`} />}
      {setup.razon_fundamental && (
        <p className="text-xs sm:text-sm text-slate-300 mt-1 break-words">
          <span className="font-medium text-slate-100">Razón:</span> {setup.razon_fundamental}
        </p>
      )}
      {!isMobile && setup.confirmaciones_adicionales && setup.confirmaciones_adicionales.length > 0 && (
        <DetailItem label="Confirmaciones" value={setup.confirmaciones_adicionales.join(', ')} />
      )}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <DetailItem label="R/R" value={setup.ratio_riesgo_beneficio} />
        <DetailItem label="Confianza" value={setup.calificacion_confianza} />
      </div>
    </div>
  );
};

const FibonacciLevelDisplay: React.FC<{ level: FibonacciLevel }> = ({ level }) => (
  <li className="text-xs">
    <span className="font-medium text-slate-200">{level.label}:</span> ${level.price.toFixed(Math.abs(level.price) < 1 ? 4 : 2)}
  </li>
);

const FibonacciAnalysisDisplay: React.FC<{ fiboAnalysis: FibonacciAnalysis | undefined }> = ({ fiboAnalysis }) => {
  if (!fiboAnalysis) {
    return <p className="text-xs sm:text-sm text-slate-400 italic">Análisis Fibonacci no disponible.</p>;
  }

  const sortedRetracementLevels = [...(fiboAnalysis.niveles_retroceso || [])].sort((a, b) => {
    // Los niveles de retroceso siempre se muestran de menor porcentaje a mayor (23.6% -> 38.2% -> 50% -> 61.8% -> 78.6%)
    // independientemente de si el impulso es alcista o bajista
    return a.level - b.level;
  });

  const sortedExtensionLevels = [...(fiboAnalysis.niveles_extension || [])].sort((a, b) => {
    return a.level - b.level;
  });

  return (
    <div className="space-y-1.5 sm:space-y-2 mt-1.5 sm:mt-2 p-2 sm:p-3 bg-slate-700 rounded-md">
      <p className="text-xs sm:text-sm text-slate-300"><span className="font-medium text-slate-100">Impulso:</span> {fiboAnalysis.descripcion_impulso}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 text-xs">
        <DetailItem label="Inicio Impulso (A)" value={fiboAnalysis.precio_inicio_impulso ? `$${fiboAnalysis.precio_inicio_impulso.toFixed(Math.abs(fiboAnalysis.precio_inicio_impulso) < 1 ? 4 : 2)}` : 'N/A'} />
        <DetailItem label="Fin Impulso (B)" value={fiboAnalysis.precio_fin_impulso ? `$${fiboAnalysis.precio_fin_impulso.toFixed(Math.abs(fiboAnalysis.precio_fin_impulso) < 1 ? 4 : 2)}` : 'N/A'} />
        {fiboAnalysis.precio_fin_retroceso != null && (
          <DetailItem label="Fin Retroceso (C)" value={`$${fiboAnalysis.precio_fin_retroceso.toFixed(Math.abs(fiboAnalysis.precio_fin_retroceso) < 1 ? 4 : 2)}`} />
        )}
      </div>

      {sortedRetracementLevels.length > 0 && (
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-200 mt-1.5 sm:mt-2 mb-1">Niveles de Retroceso (A-B):</h4>
          <ul className="list-disc list-inside space-y-0.5 pl-2">
            {sortedRetracementLevels.map((level, index) => (
              <FibonacciLevelDisplay key={`retracement-${index}`} level={level} />
            ))}
          </ul>
        </div>
      )}

      {sortedExtensionLevels.length > 0 && (
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-200 mt-1.5 sm:mt-2 mb-1">Niveles de Extensión (A-B-C):</h4>
          <ul className="list-disc list-inside space-y-0.5 pl-2">
            {sortedExtensionLevels.map((level, index) => (
              <FibonacciLevelDisplay key={`extension-${index}`} level={level} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  panelMode,
  analysisResult,
  analysisLoading,
  analysisError,
  chatMessages,
  chatLoading,
  chatError,
  onSendMessage,
  onClearChatHistory,
  theme,
  isMobile,
  apiKeyPresent,
}) => {
  const [chatInputValue, setChatInputValue] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (panelMode === 'chat') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, panelMode]);

  useEffect(() => {
    if (panelMode === 'chat' && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [panelMode]);

  const handleChatSend = () => {
    if (chatInputValue.trim()) {
      onSendMessage(chatInputValue.trim());
      setChatInputValue('');
    }
  };

  const StatusDisplayWrapper: React.FC<{ title: string; children: React.ReactNode; titleColor?: string }> = ({ title, children, titleColor = "text-sky-400" }) => (
    <div className="p-2 sm:p-3 md:p-4 bg-slate-800 rounded-lg shadow h-full">
      <h2 className={`text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-1.5 sm:mb-2 ${titleColor}`}>{title}</h2>
      <div className="text-xs text-slate-300 overflow-y-auto">{children}</div>
    </div>
  );

  const renderAnalysisContent = () => {
    if (analysisLoading) {
      return <div className="p-2 sm:p-3 md:p-4 text-center">Cargando análisis...</div>;
    }
    if (analysisError) {
      return <div className="p-2 sm:p-3 md:p-4 text-red-400 text-xs sm:text-sm break-words">Error en Análisis: {analysisError}</div>;
    }
    if (!analysisResult) {
      return <div className="p-2 sm:p-3 md:p-4 text-center text-xs sm:text-sm">Selecciona "Análisis IA" para obtener un análisis técnico.</div>;
    }

    const primaryScenario = analysisResult.escenarios_probables?.find(s => s.probabilidad === 'alta') || analysisResult.escenarios_probables?.[0];
    const alternativeScenarios = analysisResult.escenarios_probables?.filter(s => s !== primaryScenario) || [];
    const activeSignalType = analysisResult.conclusion_recomendacion?.mejor_oportunidad_actual?.tipo;
    const overallBias = analysisResult.analisis_general?.sesgo_direccional_general;
    const biasColorMap: Record<string, string> = { alcista: "text-green-400", bajista: "text-red-400" };
    const biasColorClass = biasColorMap[overallBias?.toLowerCase() || ''] || "text-slate-300";
    const activeSignalColorMap: Record<string, string> = { largo: 'text-green-400', corto: 'text-red-400' };
    const activeSignalColorClass = activeSignalColorMap[activeSignalType?.toLowerCase() || ''] || 'text-slate-300';

    return (
      <div className="p-2 sm:p-3 md:p-4 overflow-y-auto">
        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-1.5 sm:mb-2 md:mb-3 text-sky-400">Resultados del Análisis IA</h2>
        {!isMobile && primaryScenario && (
          <>
            <SectionTitle>Escenario Principal</SectionTitle>
            <div className="p-1.5 sm:p-2 md:p-3 bg-slate-700 rounded-md">
              <p className="text-xs font-semibold text-slate-100 break-words">{primaryScenario.nombre_escenario}</p>
              <p className="text-xs text-slate-300 mt-1 break-words">{primaryScenario.descripcion_detallada}</p>
              {primaryScenario.niveles_clave_de_invalidacion && (
                <p className="text-xs text-slate-400 mt-1">Invalidación: {primaryScenario.niveles_clave_de_invalidacion}</p>
              )}
              {primaryScenario.trade_setup_asociado && primaryScenario.trade_setup_asociado.tipo !== "ninguno" && (
                <>
                  <p className="text-xs font-semibold text-slate-100 mt-1.5 sm:mt-2">
                    Configuración Asociada: <span className={primaryScenario.trade_setup_asociado.tipo === 'largo' ? 'text-green-400' : 'text-red-400'}>{primaryScenario.trade_setup_asociado.tipo.toUpperCase()}</span>
                  </p>
                  <TradeSetupDisplay setup={primaryScenario.trade_setup_asociado} isMobile={isMobile} />
                </>
              )}
            </div>
          </>
        )}
        {!isMobile && !primaryScenario && (
          <p className="text-xs sm:text-sm text-slate-400 italic">No se identificó un escenario principal.</p>
        )}
        {(alternativeScenarios.length > 0 || (isMobile && primaryScenario)) && (
          <>
            <SectionTitle>Escenarios Alternativos</SectionTitle>
            {isMobile && primaryScenario && !alternativeScenarios.find(s => s.nombre_escenario === primaryScenario.nombre_escenario) && (
              <div className="mt-1.5 sm:mt-2 p-2 sm:p-3 bg-slate-700/70 rounded-md">
                <p className="text-xs sm:text-sm font-semibold text-slate-200">{primaryScenario.nombre_escenario} <span className="text-xs text-slate-400">(Prob: {primaryScenario.probabilidad})</span></p>
                <p className="text-xs text-slate-300 mt-1">{primaryScenario.descripcion_detallada}</p>
                {primaryScenario.niveles_clave_de_invalidacion && (
                  <p className="text-xs text-slate-400 mt-1">Invalidación: {primaryScenario.niveles_clave_de_invalidacion}</p>
                )}
                {primaryScenario.trade_setup_asociado && primaryScenario.trade_setup_asociado.tipo !== "ninguno" && (
                  <>
                    <p className="text-xs font-semibold text-slate-100 mt-1.5 sm:mt-2">
                      Trade Potencial: <span className={primaryScenario.trade_setup_asociado.tipo === 'largo' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{primaryScenario.trade_setup_asociado.tipo.toUpperCase()}</span>
                    </p>
                    <TradeSetupDisplay setup={primaryScenario.trade_setup_asociado} isMobile={isMobile} />
                  </>
                )}
              </div>
            )}
            {alternativeScenarios.map((scenario, index) => (
              <div key={index} className="mt-1.5 sm:mt-2 p-2 sm:p-3 bg-slate-700/70 rounded-md">
                <p className="text-xs sm:text-sm font-semibold text-slate-200">{scenario.nombre_escenario} <span className="text-xs text-slate-400">(Prob: {scenario.probabilidad})</span></p>
                <p className="text-xs text-slate-300 mt-1">{scenario.descripcion_detallada}</p>
                {scenario.niveles_clave_de_invalidacion && (
                  <p className="text-xs text-slate-400 mt-1">Invalidación: {scenario.niveles_clave_de_invalidacion}</p>
                )}
                {scenario.trade_setup_asociado && scenario.trade_setup_asociado.tipo !== "ninguno" && (
                  <>
                    <p className="text-xs font-semibold text-slate-100 mt-1.5 sm:mt-2">
                      Trade Potencial: <span className={scenario.trade_setup_asociado.tipo === 'largo' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{scenario.trade_setup_asociado.tipo.toUpperCase()}</span>
                    </p>
                    <TradeSetupDisplay setup={scenario.trade_setup_asociado} isMobile={isMobile} />
                  </>
                )}
              </div>
            ))}
          </>
        )}
        {!isMobile && (
          <>
            <SectionTitle>Señal Activa Sugerida</SectionTitle>
            <p className={`text-xs sm:text-sm font-semibold ${activeSignalColorClass}`}>
              {activeSignalType && activeSignalType !== "ninguno" ? activeSignalType.toUpperCase() : "NINGUNA"}
            </p>
            {analysisResult.proyeccion_precio_visual && (analysisResult.proyeccion_precio_visual.camino_probable_1 || analysisResult.proyeccion_precio_visual.descripcion_camino_1) && (
              <> <SectionTitle>Proyección de Precio</SectionTitle>
                {analysisResult.proyeccion_precio_visual.descripcion_camino_1 && <p className="text-xs sm:text-sm text-slate-300 mb-1">{analysisResult.proyeccion_precio_visual.descripcion_camino_1}</p>}
                {analysisResult.proyeccion_precio_visual.camino_probable_1 && (
                  <p className="text-xs text-slate-400">Ruta: {analysisResult.proyeccion_precio_visual.camino_probable_1.map(p => typeof p === 'number' ? `$${p.toFixed(Math.abs(p) < 1 ? 4 : 2)}` : p).join(' → ')}</p>
                )} </>)}
            <SectionTitle>Configuración de Trade Recomendada</SectionTitle>
            <TradeSetupDisplay setup={analysisResult.conclusion_recomendacion?.mejor_oportunidad_actual} isMobile={isMobile} />
            <SectionTitle>Análisis Fibonacci</SectionTitle>
            <FibonacciAnalysisDisplay fiboAnalysis={analysisResult.analisis_fibonacci} />
          </>)}
        {analysisResult.puntos_clave_grafico && analysisResult.puntos_clave_grafico.length > 0 && (
          <> <SectionTitle>Niveles y Zonas Clave Identificados</SectionTitle>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-300 mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-slate-700 rounded-md">
              {analysisResult.puntos_clave_grafico.map((point, index) => (
                <li key={index}>
                  <span className="font-medium text-slate-100">{point.label}</span>
                  {!isMobile && point.tipo && <span className="text-xs text-slate-400"> ({point.tipo.replace(/_/g, ' ')})</span>}
                  {point.zona && <span className="text-xs text-slate-400"> [$${point.zona[0].toFixed(Math.abs(point.zona[0]) < 1 ? 4 : 2)} - $${point.zona[1].toFixed(Math.abs(point.zona[1]) < 1 ? 4 : 2)}]</span>}
                  {point.nivel != null && <span className="text-xs text-slate-400"> @ ${typeof point.nivel === 'number' ? point.nivel.toFixed(Math.abs(point.nivel) < 1 ? 4 : 2) : point.nivel}</span>}
                  {!isMobile && point.temporalidad && <span className="text-xs text-slate-500"> ({point.temporalidad})</span>}
                  {(point.tipo === AnalysisPointType.POI_DEMANDA || point.tipo === AnalysisPointType.POI_OFERTA) && point.mitigado && <span className="text-xs text-sky-300"> (Mitigado)</span>}
                  {!isMobile && point.importancia && <span className="text-xs text-yellow-400"> Importancia: {point.importancia}</span>}
                </li>))} </ul> </>)}
        <SectionTitle>Estructura General de Mercado y Volumen</SectionTitle>
        {analysisResult.analisis_general?.estructura_mercado_resumen && Object.entries(analysisResult.analisis_general.estructura_mercado_resumen).map(([tf, desc]) =>
          desc && <DetailItem key={tf} label={`Estructura (${tf.replace('htf_', '').replace('mtf_', '').replace('ltf_', '')})`} value={desc as string} />)}
        {!isMobile && <DetailItem label="Fase Wyckoff" value={analysisResult.analisis_general?.fase_wyckoff_actual} />}
        <DetailItem label="Sesgo General" value={analysisResult.analisis_general?.sesgo_direccional_general?.toUpperCase()} valueClassName={biasColorClass + " font-semibold"} />
        {!isMobile && analysisResult.analisis_general?.comentario_volumen && (
          <p className="text-xs sm:text-sm text-slate-300 mt-1"><span className="font-medium text-slate-100">Comentario Breve de Volumen:</span> {analysisResult.analisis_general.comentario_volumen}</p>)}
        {!isMobile && analysisResult.analisis_general?.interpretacion_volumen_detallada && (
          <p className="text-xs sm:text-sm text-slate-300 mt-1"><span className="font-medium text-slate-100">Análisis Detallado de Volumen:</span> {analysisResult.analisis_general.interpretacion_volumen_detallada}</p>)}
        {!isMobile && analysisResult.analisis_general?.comentario_funding_rate_oi && (
          <> <SectionTitle>Análisis Conceptual FR/OI</SectionTitle>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 mb-1.5 sm:mb-2 p-2 sm:p-3 bg-slate-700 rounded-md">
              {analysisResult.analisis_general.comentario_funding_rate_oi} </p> </>)}
        <SectionTitle>Conclusión y Recomendaciones</SectionTitle>
        {analysisResult.conclusion_recomendacion?.resumen_ejecutivo && (
          <p className="text-xs sm:text-sm text-slate-300 mt-1 mb-1.5 sm:mb-2 p-2 sm:p-3 bg-slate-700 rounded-md">{analysisResult.conclusion_recomendacion.resumen_ejecutivo}</p>)}
        {!isMobile && <DetailItem label="Próximo Movimiento Esperado" value={analysisResult.conclusion_recomendacion?.proximo_movimiento_esperado} />}
        {!isMobile && analysisResult.conclusion_recomendacion?.oportunidades_reentrada_detectadas && (
          <> <h4 className="text-sm font-semibold mt-2 mb-1 text-sky-300">Oportunidades de Reentrada:</h4>
            <p className="text-xs sm:text-sm text-slate-300 p-2 bg-slate-700/70 rounded-md">{analysisResult.conclusion_recomendacion.oportunidades_reentrada_detectadas}</p> </>)}
        {!isMobile && analysisResult.conclusion_recomendacion?.consideraciones_salida_trade && (
          <> <h4 className="text-sm font-semibold mt-2 mb-1 text-sky-300">Consideraciones de Salida:</h4>
            <p className="text-xs sm:text-sm text-slate-300 p-2 bg-slate-700/70 rounded-md">{analysisResult.conclusion_recomendacion.consideraciones_salida_trade}</p> </>)}
        {!isMobile && analysisResult.conclusion_recomendacion?.senales_confluencia_avanzada && (
          <> <h4 className="text-sm font-semibold mt-2 mb-1 text-sky-300">Señales Avanzadas de Confluencia (Conceptual):</h4>
            <p className="text-xs sm:text-sm text-slate-300 p-2 bg-slate-700/70 rounded-md">{analysisResult.conclusion_recomendacion.senales_confluencia_avanzada}</p> </>)}
        {!isMobile && <DetailItem label="Advertencias/Riesgos" value={analysisResult.conclusion_recomendacion?.advertencias_riesgos} />}
      </div>
    );
  };

  const renderChatContent = () => {
    const chatContainerBg = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const chatTextColor = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
    const inputBgColor = theme === 'dark' ? 'bg-slate-700' : 'bg-gray-100';
    const inputBorderColor = theme === 'dark' ? 'border-slate-600' : 'border-gray-300';
    const buttonBgColor = theme === 'dark' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-sky-500 hover:bg-sky-600';
    const userMessageBg = theme === 'dark' ? 'bg-sky-700' : 'bg-sky-500';
    const aiMessageBg = theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200';
    const aiMessageText = theme === 'dark' ? 'text-slate-50' : 'text-slate-800';

    return (
      <div className={`flex flex-col h-full ${chatContainerBg} ${chatTextColor}`}>
        <div className={`flex justify-between items-center p-2 sm:p-3 md:p-4 border-b ${inputBorderColor} flex-shrink-0`}>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-sky-400">TradeGuru AI</h2>
            {apiKeyPresent && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium hidden sm:inline">Con Visión del Gráfico</span>
                <span className="text-xs text-green-400 font-medium sm:hidden">📊</span>
              </div>
            )}
          </div>
          {apiKeyPresent && chatMessages.length > 0 && (
            <button
              onClick={onClearChatHistory}
              className={`p-1 rounded-md transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                }`}
              title="Borrar historial del chat"
              aria-label="Borrar historial del chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.096M15 5.25a3 3 0 00-3-3m-3 3a3 3 0 01-3-3m-3 3a3 3 0 003 3m3 3a3 3 0 013 3m3 3a3 3 0 003-3" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex-grow p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 overflow-y-auto">
          {!apiKeyPresent && (
            <div className="p-2 sm:p-3 text-xs sm:text-sm text-yellow-300 bg-yellow-800 bg-opacity-50 rounded-lg border border-yellow-600">
              Clave API no configurada. Las funciones de Chat IA están deshabilitadas.
            </div>
          )}
          {apiKeyPresent && chatMessages.length === 0 && (
            <div className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-slate-300 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 sm:w-4 h-3 sm:h-4 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sky-400 mb-1 sm:mb-2 text-xs sm:text-sm">🧠 TradeGuru AI</h3>
                  {!isMobile && <p className="mb-2 sm:mb-3">Puedo ver y analizar:</p>}
                  <ul className="text-xs space-y-0.5 sm:space-y-1 text-slate-400">
                    <li>• 📊 El gráfico actual de {analysisResult?.analisis_general?.simbolo || 'tu símbolo'}</li>
                    {!isMobile && <li>• 🎯 Todos los niveles y zonas identificadas</li>}
                    {!isMobile && <li>• 📈 Las medias móviles activas</li>}
                    <li>• 🔍 POIs, FVGs, y estructuras de mercado</li>
                    {!isMobile && <li>• 💡 El contexto completo del análisis</li>}
                  </ul>
                  <p className="mt-2 sm:mt-3 text-xs text-sky-300">
                    💬 {isMobile ? "Pregúntame sobre el gráfico" : "Pregúntame sobre cualquier aspecto del gráfico o análisis"}
                  </p>
                </div>
              </div>
            </div>
          )}
          {apiKeyPresent && chatError && (
            <div className="p-2 sm:p-3 text-xs sm:text-sm text-red-300 bg-red-800 bg-opacity-50 rounded-lg border border-red-600 break-words">
              Error en Chat: {chatError}
            </div>
          )}
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] p-2 sm:p-3 rounded-lg text-xs sm:text-sm shadow break-words ${msg.sender === 'user'
                  ? `${userMessageBg} text-white`
                  : `${aiMessageBg} ${aiMessageText}`
                  }`}
                dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/```json\s*\n?(.*?)\n?\s*```/gs, (_, p1) => `<pre class="bg-slate-900 text-slate-100 p-2 rounded overflow-x-auto text-xs">${p1.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()}</pre>`).replace(/`([^`]+)`/g, '<code class="bg-opacity-50 bg-black text-white px-1 py-0.5 rounded text-xs">$1</code>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }}
              />
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>

        {chatLoading && (
          <div className={`px-2 sm:px-3 md:px-4 pb-1 text-xs text-center ${theme === 'dark' ? 'text-sky-300' : 'text-sky-600'}`}>
            TradeGuru IA está pensando...
          </div>
        )}

        <div className={`p-2 sm:p-3 md:p-4 border-t ${inputBorderColor} flex-shrink-0`}>
          <div className="flex items-start space-x-1 sm:space-x-2">
            <textarea
              ref={chatInputRef}
              value={chatInputValue}
              onChange={(e) => setChatInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSend();
                }
              }}
              placeholder={apiKeyPresent ? (isMobile ? "Pregunta sobre el gráfico..." : "🧠 TradeGuru AI puede ver tu gráfico - Pregúntame lo que quieras...") : "Se requiere Clave API para el chat"}
              className={`flex-grow p-2 sm:p-2.5 border rounded-md shadow-sm text-xs sm:text-sm resize-none ${inputBgColor} ${chatTextColor} ${inputBorderColor} focus:ring-sky-500 focus:border-sky-500`}
              rows={isMobile ? 1 : 2}
              disabled={chatLoading || !apiKeyPresent || (!!chatError && chatMessages.length === 0)}
              aria-label="Entrada de mensaje de chat"
            />
            <button
              onClick={handleChatSend}
              disabled={chatLoading || !chatInputValue.trim() || !apiKeyPresent || (!!chatError && chatMessages.length === 0)}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-white font-semibold rounded-md shadow-sm text-xs sm:text-sm ${buttonBgColor} disabled:bg-slate-500 disabled:cursor-not-allowed flex-shrink-0`}
              aria-label="Enviar mensaje"
            >
              {isMobile ? "🚀" : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (panelMode === 'initial') {
    return (
      <StatusDisplayWrapper title="Panel de IA">
        Selecciona "Análisis IA" para un análisis técnico o "Asistente IA" para chatear.
      </StatusDisplayWrapper>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {panelMode === 'analysis' ? renderAnalysisContent() : renderChatContent()}
    </div>
  );
};

export default AnalysisPanel;
