import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeminiAnalysisResult, GeminiRequestPayload } from "../types";
import { GEMINI_MODEL_NAME, getFullAnalysisPrompt } from "../constants";

// getApiKey function is removed as apiKey will be passed directly.

export interface ExtendedGeminiRequestPayload extends GeminiRequestPayload {
  latestVolume?: number | null;
  apiKey: string; // API key is now part of the payload
}

export const analyzeChartWithGemini = async (
  payload: ExtendedGeminiRequestPayload
): Promise<GeminiAnalysisResult> => {
  const { apiKey, ...restOfPayload } = payload; // Extract apiKey from payload

  if (!apiKey || apiKey === "TU_CLAVE_API_DE_GEMINI_AQUI") {
    console.error("API_KEY is not configured or is a placeholder. It was passed to analyzeChartWithGemini.");
    throw new Error("API Key is not configured or is a placeholder. AI analysis disabled.");
  }

  const ai = new GoogleGenAI({ apiKey }); // Use the apiKey from payload

  const fullPrompt = getFullAnalysisPrompt(
    restOfPayload.symbol,
    restOfPayload.timeframe,
    restOfPayload.currentPrice,
    restOfPayload.latestVolume
  );

  const finalPromptWithTimestamp = fullPrompt.replace("AUTO_GENERATED_TIMESTAMP_ISO8601", new Date().toISOString());

  let genAIResponse: GenerateContentResponse | undefined;

  try {
    genAIResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: finalPromptWithTimestamp,
      config: {
        responseMimeType: "application/json",
      },
    });

    // Log the raw text response from Gemini for debugging
    console.log("Raw text response from Gemini API:", genAIResponse?.text);

    let jsonStr = genAIResponse.text?.trim() || "";
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr) as GeminiAnalysisResult;

    if (!parsedData.analisis_general || !parsedData.escenarios_probables) {
      console.warn("Parsed Gemini response seems to be missing key fields.", parsedData);
    }

    return parsedData;

  } catch (error: any) {
    console.error("Error calling Gemini API or parsing response. Full error object:", error);

    let errorMessage = "Failed to get analysis from Gemini. An unknown error occurred during the API call or response processing.";

    if (error.message) {
      if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid")) {
        errorMessage = "Gemini API Key is invalid. Please check your API_KEY configuration in index.html.";
      } else if (error.message.includes("quota") || error.message.includes("Quota")) {
        errorMessage = "Gemini API quota exceeded. Please check your quota or try again later.";
      } else if (error.message.toLowerCase().includes("json") || error instanceof SyntaxError) { // Catch SyntaxError explicitly
        errorMessage = "Failed to parse the analysis from Gemini. The response was not valid JSON.";
        if (genAIResponse && typeof genAIResponse.text === 'string') {
          console.error("Problematic JSON string from Gemini (leading to parsing error):", genAIResponse.text);
        }
      } else {
        errorMessage = `Gemini API error: ${error.message}`;
      }
    } else if (typeof error === 'string' && error.includes("```")) {
      errorMessage = "Received a malformed response from Gemini (likely unparsed markdown/JSON).";
      if (genAIResponse && typeof genAIResponse.text === 'string') { // Log it here too
        console.error("Malformed (markdown/JSON) string from Gemini:", genAIResponse.text);
      }
    } else if (error && typeof error.toString === 'function') {
      const errorString = error.toString();
      errorMessage = `Gemini API call failed: ${errorString.startsWith('[object Object]') ? 'Non-descriptive error object received.' : errorString}`;
    }

    // Include raw response text in error if available and not already logged by specific conditions
    if (genAIResponse && typeof genAIResponse.text === 'string' && !errorMessage.toLowerCase().includes("json")) {
      // Avoid re-logging if already handled by the SyntaxError/json message condition
      // but ensure it's logged if some other error occurred after receiving text.
      console.error("Gemini raw response text during error:", genAIResponse.text);
    }


    throw new Error(errorMessage);
  }
};

export interface ChatWithContextPayload {
  apiKey: string;
  userMessage: string;
  chatHistory: Array<{ role: 'user' | 'model', parts: [{ text: string }] }>;
  chartContext: {
    symbol: string;
    timeframe: string;
    currentPrice: number | null;
    currentVolume: number | null;
    // Información del gráfico actual
    historicalDataSummary?: string;
    movingAveragesStatus?: string;
    // Resultado del análisis técnico actual
    analysisResult?: GeminiAnalysisResult | null;
    // Estado visual del gráfico
    visibleDrawings?: {
      aiAnalysisDrawings: boolean;
      wSignals: boolean;
      movingAverages: string[];
    };
  };
}

/**
 * Función para enviar mensajes de chat con contexto completo del gráfico y análisis
 */
export const sendChatMessageWithContext = async (
  payload: ChatWithContextPayload
): Promise<ReadableStream<{ text: string }>> => {
  const { apiKey, userMessage, chatHistory, chartContext } = payload;

  if (!apiKey || apiKey === "TU_CLAVE_API_DE_GEMINI_AQUI") {
    throw new Error("API Key is not configured or is a placeholder. Chat AI disabled.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construir el contexto enriquecido para el chat
  const contextualSystemPrompt = buildContextualSystemPrompt(chartContext);

  // Crear el historial de conversación con el contexto actualizado
  const contents = [
    {
      role: 'user' as const,
      parts: [{ text: contextualSystemPrompt }]
    },
    ...chatHistory,
    {
      role: 'user' as const,
      parts: [{ text: `CONTEXTO VISUAL ACTUAL:\n${buildCurrentVisualContext(chartContext)}\n\nPREGUNTA DEL USUARIO: ${userMessage}` }]
    }
  ];

  try {
    const result = await ai.models.generateContentStream({
      model: GEMINI_MODEL_NAME,
      contents: contents,
    });

    // Crear un stream que devuelva chunks de texto
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            const text = chunk.text;
            if (text) {
              controller.enqueue({ text });
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

  } catch (error: any) {
    console.error("Error in chat with context:", error);
    throw new Error(`Chat AI error: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Construye el prompt del sistema con contexto específico del gráfico
 */
function buildContextualSystemPrompt(chartContext: ChatWithContextPayload['chartContext']): string {
  const { symbol, timeframe } = chartContext;

  return `Eres "TradeGuru AI", un asistente de trading de élite con capacidad de VISIÓN COMPLETA del gráfico y análisis actual.

CAPACIDADES DE VISIÓN:
✅ Puedo ver el gráfico de ${symbol} en temporalidad ${timeframe}
✅ Puedo ver todos los niveles, zonas y POIs dibujados en el gráfico
✅ Puedo ver el análisis técnico completo realizado previamente
✅ Puedo ver las medias móviles y indicadores activos
✅ Puedo ver el estado actual del mercado y price action

Tu especialidad incluye:
1. Smart Money Concepts (SMC): Order blocks, liquidez, FVGs, BOS, CHoCH
2. Metodología Wyckoff: Fases de mercado, eventos clave
3. Análisis de Volumen y Footprint (conceptual)
4. Funding Rates y Open Interest
5. Niveles técnicos y confluencias
6. Gestión de riesgo y trade management

IMPORTANTE: Siempre hago referencia a lo que VEO en el gráfico actual cuando respondo. Por ejemplo:
- "Veo en el gráfico que el precio está cerca del POI de oferta en..."
- "Observo que la zona de demanda identificada en el análisis..."
- "En el gráfico actual puedo ver que..."

Proporciona respuestas específicas basadas en lo que realmente está visible en el gráfico y el análisis técnico actual. Usa markdown para claridad.
Responde en español.`;
}

/**
 * Construye el contexto visual actual para incluir en cada mensaje
 */
function buildCurrentVisualContext(chartContext: ChatWithContextPayload['chartContext']): string {
  const {
    symbol,
    timeframe,
    currentPrice,
    currentVolume,
    analysisResult,
    visibleDrawings,
    historicalDataSummary,
    movingAveragesStatus
  } = chartContext;

  let context = `=== ESTADO ACTUAL DEL GRÁFICO ===
📊 Símbolo: ${symbol}
⏰ Temporalidad: ${timeframe}
💰 Precio Actual: ${currentPrice ? `$${currentPrice.toFixed(currentPrice < 1 ? 4 : 2)}` : 'Cargando...'}
📈 Volumen Actual: ${currentVolume ? currentVolume.toLocaleString() : 'N/A'}
`;

  if (historicalDataSummary) {
    context += `\n📋 Resumen de Datos Históricos: ${historicalDataSummary}`;
  }

  if (movingAveragesStatus) {
    context += `\n📊 Estado de Medias Móviles: ${movingAveragesStatus}`;
  }

  if (visibleDrawings) {
    context += `\n🎨 Elementos Visuales Activos:
- Dibujos de Análisis IA: ${visibleDrawings.aiAnalysisDrawings ? '✅ Visibles' : '❌ Ocultos'}
- Señales W: ${visibleDrawings.wSignals ? '✅ Visibles' : '❌ Ocultas'}
- Medias Móviles Activas: ${visibleDrawings.movingAverages.join(', ') || 'Ninguna'}`;
  }

  if (analysisResult) {
    context += `\n\n=== ANÁLISIS TÉCNICO ACTUAL ===
🎯 Sesgo Direccional: ${analysisResult.analisis_general?.sesgo_direccional_general || 'No definido'}
⚡ Fase Wyckoff: ${analysisResult.analisis_general?.fase_wyckoff_actual || 'No identificada'}
📊 Volumen: ${analysisResult.analisis_general?.comentario_volumen || 'Sin comentarios'}

🔍 PUNTOS CLAVE VISIBLES EN EL GRÁFICO:`;

    if (analysisResult.puntos_clave_grafico && analysisResult.puntos_clave_grafico.length > 0) {
      analysisResult.puntos_clave_grafico.slice(0, 5).forEach((point, index) => {
        const levelText = point.zona
          ? `$${point.zona[0].toFixed(point.zona[0] < 1 ? 4 : 2)} - $${point.zona[1].toFixed(point.zona[1] < 1 ? 4 : 2)}`
          : point.nivel ? `$${point.nivel.toFixed(point.nivel < 1 ? 4 : 2)}` : 'N/A';

        context += `\n  ${index + 1}. ${point.label}: ${levelText} (${point.temporalidad || 'N/A'})`;
        if (point.mitigado !== undefined) {
          context += ` - ${point.mitigado ? '🔴 Mitigado' : '🟢 No mitigado'}`;
        }
      });
    }

    if (analysisResult.escenarios_probables && analysisResult.escenarios_probables.length > 0) {
      context += `\n\n🎯 ESCENARIOS PRINCIPALES:`;
      analysisResult.escenarios_probables.slice(0, 2).forEach((escenario, index) => {
        context += `\n  ${index + 1}. ${escenario.nombre_escenario} (${escenario.probabilidad} probabilidad)`;
        if (escenario.trade_setup_asociado) {
          const setup = escenario.trade_setup_asociado;
          context += `\n     📍 Setup: ${setup.tipo?.toUpperCase()} en $${setup.punto_entrada_ideal?.toFixed(setup.punto_entrada_ideal < 1 ? 4 : 2)}`;
          context += `\n     🛡️ SL: $${setup.stop_loss?.toFixed(setup.stop_loss < 1 ? 4 : 2)}`;
          context += `\n     🎯 TP1: $${setup.take_profit_1?.toFixed(setup.take_profit_1 < 1 ? 4 : 2)}`;
        }
      });
    }

    if (analysisResult.conclusion_recomendacion) {
      context += `\n\n💡 RESUMEN EJECUTIVO:`;
      context += `\n${analysisResult.conclusion_recomendacion.resumen_ejecutivo}`;

      if (analysisResult.conclusion_recomendacion.proximo_movimiento_esperado) {
        context += `\n\n🔮 PRÓXIMO MOVIMIENTO ESPERADO:`;
        context += `\n${analysisResult.conclusion_recomendacion.proximo_movimiento_esperado}`;
      }
    }
  }

  context += `\n\n=== FIN DEL CONTEXTO VISUAL ===`;

  return context;
}
