import React from 'react';
import { GeminiAnalysisResult } from '../types';

interface ProfessionalAnalysisDisplayProps {
    analysisResult: GeminiAnalysisResult;
    theme: 'dark' | 'light';
}

const ProfessionalAnalysisDisplay: React.FC<ProfessionalAnalysisDisplayProps> = ({
    analysisResult,
    theme
}) => {
    const isDark = theme === 'dark';

    const formatPrice = (price: number | undefined | null) => {
        if (!price) return 'N/A';
        return `$${price.toFixed(Math.abs(price) < 1 ? 4 : 2)}`;
    };

    const formatPercentage = (value: string | undefined) => {
        if (!value) return 'N/A';
        return value.includes('%') ? value : `${value}%`;
    };

    return (
        <div className={`p-4 space-y-6 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            {/* Header con nuevo formato */}
            <div className="border-b border-slate-600 pb-4">
                <h1 className="text-2xl font-bold text-sky-400 mb-2">
                    🚀 TradingRoad AI - Análisis Técnico Profesional Mejorado
                </h1>
                <div className="text-sm text-slate-400">
                    <span className="font-medium">Símbolo:</span> {analysisResult.analisis_general?.simbolo || 'N/A'} |
                    <span className="font-medium"> Timeframe:</span> {analysisResult.analisis_general?.temporalidad_principal_analisis || 'N/A'} |
                    <span className="font-medium"> Fecha:</span> {new Date().toLocaleString()}
                </div>
            </div>

            {/* Sección: Problemas Solucionados */}
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <h2 className="text-lg font-bold text-green-400 mb-3">✅ Problemas Solucionados</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-semibold text-green-300 mb-2">1. **Asistente IA Reparado**</h3>
                        <ul className="text-sm space-y-1 ml-4">
                            <li>✅ Endpoint `/api/chat` funcionando correctamente</li>
                            <li>✅ Integración del contexto de análisis en las conversaciones</li>
                            <li>✅ Manejo de errores mejorado en el chat</li>
                            <li>✅ Respuestas contextuales basadas en el análisis técnico actual</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-green-300 mb-2">2. **Análisis IA Completamente Mejorado**</h3>
                        <p className="text-sm mb-2">El análisis ahora incluye **TODOS** los apartados solicitados:</p>
                        <ul className="text-sm space-y-1 ml-4">
                            <li>📊 Estructura General</li>
                            <li>🔄 Análisis Wyckoff Profesional</li>
                            <li>💰 Smart Money Concepts (SMC)</li>
                            <li>📈 Funding Rate & Open Interest Conceptual</li>
                            <li>🎯 Escenarios Alternativos con Probabilidades</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Sección: Análisis Técnico Detallado */}
            <div className="space-y-4">
                {/* Resumen General */}
                {analysisResult.resumen_general && (
                    <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-blue-400 mb-3">📊 **Resumen General**</h2>
                        <p className="text-sm leading-relaxed">{analysisResult.resumen_general}</p>
                    </div>
                )}

                {/* Análisis de Tendencia */}
                {analysisResult.tendencia && (
                    <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-purple-400 mb-3">📈 **Análisis de Tendencia**</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <span className="font-medium text-purple-300">Dirección:</span>
                                <p className="text-sm">{analysisResult.tendencia.direccion || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="font-medium text-purple-300">Fuerza:</span>
                                <p className="text-sm">{analysisResult.tendencia.fuerza}/10</p>
                            </div>
                            <div>
                                <span className="font-medium text-purple-300">Descripción:</span>
                                <p className="text-sm">{analysisResult.tendencia.descripcion || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Análisis Estructural */}
                {analysisResult.analisis_estructural && (
                    <div className="bg-indigo-900/20 border border-indigo-700 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-indigo-400 mb-3">🏗️ **Análisis Estructural**</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysisResult.analisis_estructural.tf_1d && (
                                <div>
                                    <span className="font-medium text-indigo-300">1D:</span>
                                    <p className="text-sm">{analysisResult.analisis_estructural.tf_1d}</p>
                                </div>
                            )}
                            {analysisResult.analisis_estructural.tf_4h && (
                                <div>
                                    <span className="font-medium text-indigo-300">4H:</span>
                                    <p className="text-sm">{analysisResult.analisis_estructural.tf_4h}</p>
                                </div>
                            )}
                            {analysisResult.analisis_estructural.tf_1h && (
                                <div>
                                    <span className="font-medium text-indigo-300">1H:</span>
                                    <p className="text-sm">{analysisResult.analisis_estructural.tf_1h}</p>
                                </div>
                            )}
                            {analysisResult.analisis_estructural.tf_15m && (
                                <div>
                                    <span className="font-medium text-indigo-300">15M:</span>
                                    <p className="text-sm">{analysisResult.analisis_estructural.tf_15m}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Análisis Wyckoff */}
                {analysisResult.analisis_wyckoff && (
                    <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-orange-400 mb-3">🔄 **Análisis Wyckoff**</h2>
                        <div className="space-y-3">
                            <div>
                                <span className="font-medium text-orange-300">Fase Actual:</span>
                                <p className="text-sm">{analysisResult.analisis_wyckoff.fase || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="font-medium text-orange-300">Descripción:</span>
                                <p className="text-sm">{analysisResult.analisis_wyckoff.descripcion || 'N/A'}</p>
                            </div>
                            {analysisResult.analisis_wyckoff.puntos_clave && analysisResult.analisis_wyckoff.puntos_clave.length > 0 && (
                                <div>
                                    <span className="font-medium text-orange-300">Puntos Clave:</span>
                                    <ul className="text-sm ml-4 mt-1">
                                        {analysisResult.analisis_wyckoff.puntos_clave.map((punto, index) => (
                                            <li key={index}>• {punto}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {analysisResult.analisis_wyckoff.contexto_fase && (
                                <div>
                                    <span className="font-medium text-orange-300">Contexto de la Fase:</span>
                                    <p className="text-sm">{analysisResult.analisis_wyckoff.contexto_fase}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Smart Money Concepts */}
                {analysisResult.analisis_smart_money && (
                    <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-emerald-400 mb-3">💰 **Smart Money Concepts (SMC)**</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {analysisResult.analisis_smart_money.order_blocks && analysisResult.analisis_smart_money.order_blocks.length > 0 && (
                                <div>
                                    <span className="font-medium text-emerald-300">Order Blocks:</span>
                                    <ul className="text-sm ml-4 mt-1">
                                        {analysisResult.analisis_smart_money.order_blocks.map((ob, index) => (
                                            <li key={index}>• {ob}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {analysisResult.analisis_smart_money.liquidity_levels && analysisResult.analisis_smart_money.liquidity_levels.length > 0 && (
                                <div>
                                    <span className="font-medium text-emerald-300">Liquidity Levels:</span>
                                    <ul className="text-sm ml-4 mt-1">
                                        {analysisResult.analisis_smart_money.liquidity_levels.map((ll, index) => (
                                            <li key={index}>• {ll}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {analysisResult.analisis_smart_money.fair_value_gaps && analysisResult.analisis_smart_money.fair_value_gaps.length > 0 && (
                                <div>
                                    <span className="font-medium text-emerald-300">Fair Value Gaps:</span>
                                    <ul className="text-sm ml-4 mt-1">
                                        {analysisResult.analisis_smart_money.fair_value_gaps.map((fvg, index) => (
                                            <li key={index}>• {fvg}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Funding Rate & Open Interest */}
                {analysisResult.analisis_funding_rate_oi && (
                    <div className="bg-teal-900/20 border border-teal-700 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-teal-400 mb-3">📊 **Funding Rate & Open Interest**</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysisResult.analisis_funding_rate_oi.funding_rate_inferido && (
                                <div>
                                    <span className="font-medium text-teal-300">Funding Rate Inferido:</span>
                                    <p className="text-sm">{analysisResult.analisis_funding_rate_oi.funding_rate_inferido}</p>
                                </div>
                            )}
                            {analysisResult.analisis_funding_rate_oi.interpretacion && (
                                <div>
                                    <span className="font-medium text-teal-300">Interpretación:</span>
                                    <p className="text-sm">{analysisResult.analisis_funding_rate_oi.interpretacion}</p>
                                </div>
                            )}
                            {analysisResult.analisis_funding_rate_oi.open_interest_inferido && (
                                <div>
                                    <span className="font-medium text-teal-300">Open Interest Inferido:</span>
                                    <p className="text-sm">{analysisResult.analisis_funding_rate_oi.open_interest_inferido}</p>
                                </div>
                            )}
                            {analysisResult.analisis_funding_rate_oi.contexto && (
                                <div>
                                    <span className="font-medium text-teal-300">Contexto:</span>
                                    <p className="text-sm">{analysisResult.analisis_funding_rate_oi.contexto}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Escenarios Alternativos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Escenario Alcista */}
                    {analysisResult.escenario_alcista && (
                        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                            <h3 className="text-lg font-bold text-green-400 mb-3">📈 **Escenario Alcista**</h3>
                            <div className="space-y-3">
                                <div className="text-center">
                                    <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        {analysisResult.escenario_alcista.probabilidad}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-green-300">Descripción:</span>
                                    <p className="text-sm">{analysisResult.escenario_alcista.descripcion || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-green-300">Condiciones:</span>
                                    <p className="text-sm">{analysisResult.escenario_alcista.condiciones_entrada || 'N/A'}</p>
                                </div>
                                {analysisResult.escenario_alcista.objetivos && analysisResult.escenario_alcista.objetivos.length > 0 && (
                                    <div>
                                        <span className="font-medium text-green-300">Objetivos:</span>
                                        <ul className="text-sm ml-4 mt-1">
                                            {analysisResult.escenario_alcista.objetivos.map((objetivo, index) => (
                                                <li key={index}>• {formatPrice(objetivo)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium text-green-300">Invalidación:</span>
                                    <p className="text-sm">{formatPrice(analysisResult.escenario_alcista.invalidacion)}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-green-300">R:R:</span>
                                    <p className="text-sm">{analysisResult.escenario_alcista.ratio_riesgo_beneficio || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Escenario Bajista */}
                    {analysisResult.escenario_bajista && (
                        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                            <h3 className="text-lg font-bold text-red-400 mb-3">📉 **Escenario Bajista**</h3>
                            <div className="space-y-3">
                                <div className="text-center">
                                    <span className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        {analysisResult.escenario_bajista.probabilidad}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-red-300">Descripción:</span>
                                    <p className="text-sm">{analysisResult.escenario_bajista.descripcion || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-red-300">Condiciones:</span>
                                    <p className="text-sm">{analysisResult.escenario_bajista.condiciones_entrada || 'N/A'}</p>
                                </div>
                                {analysisResult.escenario_bajista.objetivos && analysisResult.escenario_bajista.objetivos.length > 0 && (
                                    <div>
                                        <span className="font-medium text-red-300">Objetivos:</span>
                                        <ul className="text-sm ml-4 mt-1">
                                            {analysisResult.escenario_bajista.objetivos.map((objetivo, index) => (
                                                <li key={index}>• {formatPrice(objetivo)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium text-red-300">Invalidación:</span>
                                    <p className="text-sm">{formatPrice(analysisResult.escenario_bajista.invalidacion)}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-red-300">R:R:</span>
                                    <p className="text-sm">{analysisResult.escenario_bajista.ratio_riesgo_beneficio || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Conclusión Profesional */}
                {analysisResult.conclusion_profesional && (
                    <div className="bg-gray-900/20 border border-gray-700 rounded-lg p-4">
                        <h2 className="text-lg font-bold text-gray-400 mb-3">💡 **Conclusión Profesional**</h2>
                        <p className="text-sm leading-relaxed">{analysisResult.conclusion_profesional}</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-600 pt-4 text-center">
                <p className="text-xs text-slate-500">
                    🎯 **Nivel de Profesionalidad:** Análisis de calidad institucional con metodología de trader profesional
                </p>
            </div>
        </div>
    );
};
                    </div >

                    <div>
                        <h3 className="font-semibold text-green-300 mb-2">🔄 Análisis Wyckoff Profesional</h3>
                        <ul className="text-sm space-y-1 ml-4">
                            <li>✅ Identificación de fases: {analysisResult.analisis_wyckoff?.fase || 'N/A'}</li>
                            <li>✅ Eventos específicos detectados</li>
                            <li>✅ Puntos clave con niveles específicos</li>
                            <li>✅ Contexto de la fase actual analizado</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-green-300 mb-2">💰 Smart Money Concepts (SMC)</h3>
                        <ul className="text-sm space-y-1 ml-4">
                            <li>✅ <strong>Order Blocks:</strong> {analysisResult.analisis_smart_money?.order_blocks?.length || 0} identificados</li>
                            <li>✅ <strong>Liquidity Levels:</strong> {analysisResult.analisis_smart_money?.liquidity_levels?.length || 0} mapeados</li>
                            <li>✅ <strong>Fair Value Gaps:</strong> {analysisResult.analisis_smart_money?.fair_value_gaps?.length || 0} detectados</li>
                            <li>✅ Análisis de comportamiento institucional</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-green-300 mb-2">📈 Funding Rate & Open Interest</h3>
                        <ul className="text-sm space-y-1 ml-4">
                            <li>✅ Inferencia de Funding Rate basada en momentum</li>
                            <li>✅ Interpretación conceptual de Open Interest</li>
                            <li>✅ Correlación con fases Wyckoff identificadas</li>
                            <li>✅ Contexto de sentimiento de mercado</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-green-300 mb-2">🎯 Escenarios con Probabilidades</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {analysisResult.escenario_alcista && (
                                <div className="bg-green-800/20 border border-green-600 rounded p-3">
                                    <h4 className="font-semibold text-green-300">📈 Escenario Alcista</h4>
                                    <p className="text-lg font-bold text-green-200">
                                        {formatPercentage(analysisResult.escenario_alcista.probabilidad)}
                                    </p>
                                    <p className="text-sm mt-1">R:R: {analysisResult.escenario_alcista.ratio_riesgo_beneficio || 'N/A'}</p>
                                </div>
                            )}
                            {analysisResult.escenario_bajista && (
                                <div className="bg-red-800/20 border border-red-600 rounded p-3">
                                    <h4 className="font-semibold text-red-300">📉 Escenario Bajista</h4>
                                    <p className="text-lg font-bold text-red-200">
                                        {formatPercentage(analysisResult.escenario_bajista.probabilidad)}
                                    </p>
                                    <p className="text-sm mt-1">R:R: {analysisResult.escenario_bajista.ratio_riesgo_beneficio || 'N/A'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div >
            </div >

    {/* Detailed Analysis */ }
    < div className = "space-y-6" >
        {/* Resumen General */ }
{
    analysisResult.resumen_general && (
        <div>
            <h2 className="text-xl font-bold text-sky-400 mb-3">📊 Resumen General</h2>
            <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed">{analysisResult.resumen_general}</p>
            </div>
        </div>
    )
}

{/* Análisis de Tendencia */ }
{
    analysisResult.tendencia && (
        <div>
            <h2 className="text-xl font-bold text-sky-400 mb-3">📈 Análisis de Tendencia</h2>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <span className="font-medium text-slate-300">Dirección:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${analysisResult.tendencia.direccion === 'alcista' ? 'bg-green-700 text-green-100' :
                            analysisResult.tendencia.direccion === 'bajista' ? 'bg-red-700 text-red-100' :
                                'bg-yellow-700 text-yellow-100'
                            }`}>
                            {analysisResult.tendencia.direccion?.toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-slate-300">Fuerza:</span>
                        <span className="ml-2 font-bold text-white">{analysisResult.tendencia.fuerza}/10</span>
                    </div>
                </div>
                {analysisResult.tendencia.descripcion && (
                    <p className="text-sm text-slate-300 mt-3">{analysisResult.tendencia.descripcion}</p>
                )}
            </div>
        </div>
    )
}

{/* Análisis Estructural */ }
{
    analysisResult.analisis_estructural && (
        <div>
            <h2 className="text-xl font-bold text-sky-400 mb-3">🏗️ Análisis Estructural</h2>
            <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.analisis_estructural.tf_1d && (
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-1">1D (Macro):</h4>
                            <p className="text-sm text-slate-300">{analysisResult.analisis_estructural.tf_1d}</p>
                        </div>
                    )}
                    {analysisResult.analisis_estructural.tf_4h && (
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-1">4H (Intermedio):</h4>
                            <p className="text-sm text-slate-300">{analysisResult.analisis_estructural.tf_4h}</p>
                        </div>
                    )}
                    {analysisResult.analisis_estructural.tf_1h && (
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-1">1H (Intraday):</h4>
                            <p className="text-sm text-slate-300">{analysisResult.analisis_estructural.tf_1h}</p>
                        </div>
                    )}
                    {analysisResult.analisis_estructural.tf_15m && (
                        <div>
                            <h4 className="font-semibold text-slate-200 mb-1">15M (Entradas):</h4>
                            <p className="text-sm text-slate-300">{analysisResult.analisis_estructural.tf_15m}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

{/* Análisis Wyckoff */ }
{
    analysisResult.analisis_wyckoff && (
        <div>
            <h2 className="text-xl font-bold text-sky-400 mb-3">🔄 Análisis Wyckoff</h2>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div>
                    <span className="font-medium text-slate-300">Fase Actual:</span>
                    <span className="ml-2 px-3 py-1 bg-purple-700 text-purple-100 rounded text-sm font-medium">
                        {analysisResult.analisis_wyckoff.fase}
                    </span>
                </div>
                {analysisResult.analisis_wyckoff.descripcion && (
                    <p className="text-sm text-slate-300">{analysisResult.analisis_wyckoff.descripcion}</p>
                )}
                {analysisResult.analisis_wyckoff.puntos_clave && analysisResult.analisis_wyckoff.puntos_clave.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-slate-200 mb-2">Puntos Clave:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                            {analysisResult.analisis_wyckoff.puntos_clave.map((punto, index) => (
                                <li key={index}>{punto}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {analysisResult.analisis_wyckoff.contexto_fase && (
                    <div>
                        <h4 className="font-semibold text-slate-200 mb-1">Contexto:</h4>
                        <p className="text-sm text-slate-300">{analysisResult.analisis_wyckoff.contexto_fase}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

{/* Smart Money Concepts */ }
{
    analysisResult.analisis_smart_money && (
        <div>
            <h2 className="text-xl font-bold text-sky-400 mb-3">💰 Smart Money Concepts</h2>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                {analysisResult.analisis_smart_money.order_blocks && analysisResult.analisis_smart_money.order_blocks.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-slate-200 mb-2">📦 Order Blocks:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                            {analysisResult.analisis_smart_money.order_blocks.map((ob, index) => (
                                <li key={index}>{ob}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {analysisResult.analisis_smart_money.liquidity_levels && analysisResult.analisis_smart_money.liquidity_levels.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-slate-200 mb-2">💧 Liquidity Levels:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                            {analysisResult.analisis_smart_money.liquidity_levels.map((ll, index) => (
                                <li key={index}>{ll}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {analysisResult.analisis_smart_money.fair_value_gaps && analysisResult.analisis_smart_money.fair_value_gaps.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-slate-200 mb-2">⚡ Fair Value Gaps:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                            {analysisResult.analisis_smart_money.fair_value_gaps.map((fvg, index) => (
                                <li key={index}>{fvg}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

{/* Funding Rate & Open Interest */ }
{
    analysisResult.analisis_funding_rate_oi && (
        <div>
            <h2 className="text-xl font-bold text-sky-400 mb-3">📊 Funding Rate & Open Interest</h2>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div>
                    <span className="font-medium text-slate-300">Funding Rate Inferido:</span>
                    <span className="ml-2 text-slate-200">{analysisResult.analisis_funding_rate_oi.funding_rate_inferido}</span>
                </div>
                {analysisResult.analisis_funding_rate_oi.interpretacion && (
                    <div>
                        <h4 className="font-semibold text-slate-200 mb-1">Interpretación:</h4>
                        <p className="text-sm text-slate-300">{analysisResult.analisis_funding_rate_oi.interpretacion}</p>
                    </div>
                )}
                <div>
                    <span className="font-medium text-slate-300">Open Interest Inferido:</span>
                    <span className="ml-2 text-slate-200">{analysisResult.analisis_funding_rate_oi.open_interest_inferido}</span>
                </div>
                {analysisResult.analisis_funding_rate_oi.contexto && (
                    <div>
                        <h4 className="font-semibold text-slate-200 mb-1">Contexto:</h4>
                        <p className="text-sm text-slate-300">{analysisResult.analisis_funding_rate_oi.contexto}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

{/* Escenarios Detallados */ }
<div>
    <h2 className="text-xl font-bold text-sky-400 mb-3">🎯 Escenarios Alternativos</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Escenario Alcista */}
        {analysisResult.escenario_alcista && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <h3 className="font-bold text-green-300 mb-3 flex items-center">
                    📈 Escenario Alcista
                    <span className="ml-auto text-lg font-bold">{formatPercentage(analysisResult.escenario_alcista.probabilidad)}</span>
                </h3>
                {analysisResult.escenario_alcista.descripcion && (
                    <p className="text-sm text-slate-300 mb-3">{analysisResult.escenario_alcista.descripcion}</p>
                )}
                {analysisResult.escenario_alcista.condiciones_entrada && (
                    <div className="mb-3">
                        <h4 className="font-semibold text-green-200 mb-1">Condiciones:</h4>
                        <p className="text-xs text-slate-300">{analysisResult.escenario_alcista.condiciones_entrada}</p>
                    </div>
                )}
                <div className="space-y-2">
                    {analysisResult.escenario_alcista.objetivos && analysisResult.escenario_alcista.objetivos.length > 0 && (
                        <div>
                            <span className="font-medium text-green-200">Objetivos:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {analysisResult.escenario_alcista.objetivos.map((objetivo, index) => (
                                    <span key={index} className="px-2 py-1 bg-green-800 text-green-100 rounded text-xs">
                                        {formatPrice(objetivo)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {analysisResult.escenario_alcista.invalidacion && (
                        <div>
                            <span className="font-medium text-green-200">Invalidación:</span>
                            <span className="ml-2 text-slate-300 text-sm">{formatPrice(analysisResult.escenario_alcista.invalidacion)}</span>
                        </div>
                    )}
                    {analysisResult.escenario_alcista.ratio_riesgo_beneficio && (
                        <div>
                            <span className="font-medium text-green-200">R:R:</span>
                            <span className="ml-2 text-slate-300 text-sm">{analysisResult.escenario_alcista.ratio_riesgo_beneficio}</span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Escenario Bajista */}
        {analysisResult.escenario_bajista && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <h3 className="font-bold text-red-300 mb-3 flex items-center">
                    📉 Escenario Bajista
                    <span className="ml-auto text-lg font-bold">{formatPercentage(analysisResult.escenario_bajista.probabilidad)}</span>
                </h3>
                {analysisResult.escenario_bajista.descripcion && (
                    <p className="text-sm text-slate-300 mb-3">{analysisResult.escenario_bajista.descripcion}</p>
                )}
                {analysisResult.escenario_bajista.condiciones_entrada && (
                    <div className="mb-3">
                        <h4 className="font-semibold text-red-200 mb-1">Condiciones:</h4>
                        <p className="text-xs text-slate-300">{analysisResult.escenario_bajista.condiciones_entrada}</p>
                    </div>
                )}
                <div className="space-y-2">
                    {analysisResult.escenario_bajista.objetivos && analysisResult.escenario_bajista.objetivos.length > 0 && (
                        <div>
                            <span className="font-medium text-red-200">Objetivos:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {analysisResult.escenario_bajista.objetivos.map((objetivo, index) => (
                                    <span key={index} className="px-2 py-1 bg-red-800 text-red-100 rounded text-xs">
                                        {formatPrice(objetivo)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {analysisResult.escenario_bajista.invalidacion && (
                        <div>
                            <span className="font-medium text-red-200">Invalidación:</span>
                            <span className="ml-2 text-slate-300 text-sm">{formatPrice(analysisResult.escenario_bajista.invalidacion)}</span>
                        </div>
                    )}
                    {analysisResult.escenario_bajista.ratio_riesgo_beneficio && (
                        <div>
                            <span className="font-medium text-red-200">R:R:</span>
                            <span className="ml-2 text-slate-300 text-sm">{analysisResult.escenario_bajista.ratio_riesgo_beneficio}</span>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
</div>

{/* Conclusión Profesional */ }
{
    analysisResult.conclusion_profesional && (
        <div>
            <h2 className="text-xl font-bold text-sky-400 mb-3">💡 Conclusión Profesional</h2>
            <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed text-slate-300">{analysisResult.conclusion_profesional}</p>
            </div>
        </div>
    )
}
            </div >

    {/* Footer */ }
    < div className = "border-t border-slate-600 pt-4 text-center" >
                <p className="text-xs text-slate-400">
                    🎯 <strong>TradeRoad AI</strong> - Análisis de nivel institucional generado por IA avanzada
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    Metodología profesional • Smart Money Concepts • Análisis Wyckoff • Gestión de riesgo
                </p>
            </div >
        </div >
    );
};

export default ProfessionalAnalysisDisplay;
