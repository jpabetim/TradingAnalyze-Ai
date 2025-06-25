import { GeminiAnalysisResult } from './types';

// Datos de ejemplo para probar las señales de trading
export const mockAnalysisData: GeminiAnalysisResult = {
    analisis_general: {
        simbolo: "BTCUSDT",
        temporalidad_principal_analisis: "1H",
        fecha_analisis: "2024-01-15 14:30 UTC",
        sesgo_direccional_general: "alcista",
        estructura_mercado_resumen: {
            htf_1D: "Tendencia alcista fuerte",
            mtf_4H: "Retroceso saludable",
            ltf_1H: "Búsqueda de entrada"
        }
    },

    // Puntos clave del gráfico con diferentes tipos de señales (precios actualizados para Bitcoin)
    puntos_clave_grafico: [
        {
            tipo: "poi_demanda",
            zona: [95000, 96000],
            label: "Demand Zone HTF",
            temporalidad: "4H",
            mitigado: false,
            importancia: "alta"
        },
        {
            tipo: "fvg_alcista",
            zona: [97200, 98000],
            label: "FVG Bullish",
            temporalidad: "1H",
            mitigado: false,
            importancia: "media"
        },
        {
            tipo: "bos_alcista",
            nivel: 99500,
            label: "BOS Bullish",
            temporalidad: "1H",
            importancia: "alta"
        },
        {
            tipo: "liquidez_vendedora",
            nivel: 94000,
            label: "BSL",
            temporalidad: "4H",
            importancia: "media"
        },
        {
            tipo: "choch_bajista",
            nivel: 101200,
            label: "ChoCh Bearish",
            temporalidad: "1H",
            importancia: "media"
        },
        {
            tipo: "entrada_largo",
            nivel: 95800,
            label: "Long Entry",
            temporalidad: "1H",
            importancia: "alta"
        },
        {
            tipo: "take_profit",
            nivel: 102000,
            label: "TP1",
            temporalidad: "1H",
            importancia: "alta"
        },
        {
            tipo: "stop_loss",
            nivel: 93000,
            label: "SL",
            temporalidad: "1H",
            importancia: "alta"
        }
    ],

    liquidez_importante: {
        buy_side: [
            {
                tipo: "liquidez_compradora",
                nivel: 103500,
                label: "BSL High",
                temporalidad: "4H",
                importancia: "alta"
            }
        ],
        sell_side: [
            {
                tipo: "liquidez_vendedora",
                nivel: 92200,
                label: "SSL Low",
                temporalidad: "4H",
                importancia: "alta"
            }
        ]
    },

    zonas_criticas_oferta_demanda: {
        oferta_clave: [
            {
                tipo: "poi_oferta",
                zona: [100000, 101500],
                label: "Supply Zone",
                temporalidad: "4H",
                mitigado: false,
                importancia: "alta"
            }
        ],
        demanda_clave: [
            {
                tipo: "poi_demanda",
                zona: [95000, 96000],
                label: "Demand Zone",
                temporalidad: "4H",
                mitigado: false,
                importancia: "alta"
            }
        ],
        fvg_importantes: [
            {
                tipo: "fvg_alcista",
                zona: [97200, 98000],
                label: "FVG Important",
                temporalidad: "1H",
                mitigado: false,
                importancia: "alta"
            }
        ]
    },

    // Análisis Fibonacci
    analisis_fibonacci: {
        descripcion_impulso: "Impulso alcista desde $92000 a $105000 tras BOS en 4H",
        precio_inicio_impulso: 92000,
        precio_fin_impulso: 105000,
        precio_fin_retroceso: 96500,
        niveles_retroceso: [
            { level: 0.236, price: 101932, label: "Retroceso 23.6%" },
            { level: 0.382, price: 100034, label: "Retroceso 38.2%" },
            { level: 0.5, price: 98500, label: "Retroceso 50%" },
            { level: 0.618, price: 96966, label: "Retroceso 61.8%" },
            { level: 0.786, price: 94782, label: "Retroceso 78.6%" }
        ],
        niveles_extension: [
            { level: 1.272, price: 108536, label: "Extensión 127.2%" },
            { level: 1.618, price: 113034, label: "Extensión 161.8%" },
            { level: 2.618, price: 126034, label: "Extensión 261.8%" }
        ]
    },

    escenarios_probables: [
        {
            nombre_escenario: "Continuación Alcista",
            probabilidad: "alta",
            descripcion_detallada: "Esperamos continuación alcista tras mitigar demanda",
            trade_setup_asociado: {
                tipo: "largo",
                descripcion_entrada: "Entrada en zona de demanda 95000-96000",
                punto_entrada_ideal: 95250,
                zona_entrada: [95000, 96000],
                stop_loss: 93000,
                take_profit_1: 99000,
                take_profit_2: 102000,
                take_profit_3: 105000,
                razon_fundamental: "Zona de demanda fuerte sin mitigar",
                ratio_riesgo_beneficio: "1:3",
                calificacion_confianza: "alta"
            }
        }
    ],

    conclusion_recomendacion: {
        resumen_ejecutivo: "Bias alcista dominante con setup de entrada en demanda",
        proximo_movimiento_esperado: "Retroceso a zona de demanda para continuación alcista",
        mejor_oportunidad_actual: {
            tipo: "largo",
            descripcion_entrada: "Entrada en zona de demanda 95000-96000 con confirmación",
            punto_entrada_ideal: 95250,
            zona_entrada: [95000, 96000],
            stop_loss: 93000,
            take_profit_1: 99000,
            take_profit_2: 102000,
            take_profit_3: 105000,
            razon_fundamental: "Zona de demanda fuerte sin mitigar en HTF",
            ratio_riesgo_beneficio: "1:3",
            calificacion_confianza: "alta"
        }
    },

    // Proyección visual del precio (línea azul discontinua)
    proyeccion_precio_visual: {
        camino_probable_1: [
            97800, 98200, 97500, 96800, 95500, 95200, 96100, 97800, 99500, 101200, 102800, 104500
        ],
        descripcion_camino_1: "Retroceso inicial hacia zona de demanda, seguido de impulso alcista hacia objetivos Fibonacci"
    }
};
