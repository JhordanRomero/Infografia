import { GoogleGenAI, Type } from "@google/genai";
import type { InfographicData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const infographicSchema = {
    type: Type.OBJECT,
    properties: {
        page1: {
            type: Type.OBJECT,
            properties: {
                mainTitle: { type: Type.STRING },
                date: { type: Type.STRING },
                mainKpis: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING },
                            value: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                    },
                },
                marketSummaries: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            marketName: { type: Type.STRING },
                            mainPercentage: { type: Type.NUMBER },
                            statusTable: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        participants: { type: Type.STRING },
                                        status: { type: Type.STRING },
                                    },
                                },
                            },
                            pieChartData: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.NUMBER },
                                    },
                                },
                            },
                            barChartData: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        value: { type: Type.NUMBER },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        page2: {
            type: Type.OBJECT,
            properties: {
                mainTitle: { type: Type.STRING },
                marketBreakdowns: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            marketName: { type: Type.STRING },
                            overallStats: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        label: { type: Type.STRING },
                                        value: { type: Type.STRING }
                                    }
                                }
                            },
                            localStats: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        localName: { type: Type.STRING },
                                        asistencia: { type: Type.STRING },
                                        completitud: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                },
            },
        },
        page3: {
            type: Type.OBJECT,
            properties: {
                mainTitle: { type: Type.STRING },
                highlightsTitle: { type: Type.STRING },
                highlights: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            marketName: { type: Type.STRING },
                            icon: { type: Type.STRING, description: "A relevant Google Material Symbols icon name like 'check_circle', 'star', 'thumb_up'." },
                            content: { type: Type.STRING },
                        },
                    },
                },
            },
        },
    },
};

const getPrompt = (text: string) => `
Eres un diseñador experto en visualización de datos creando una infografía de 3 páginas a partir de un reporte de negocio.
El reporte es para Walmart y debe seguir una estética minimalista y profesional.
Tu tarea es analizar el texto del reporte proporcionado y convertirlo en un objeto JSON estructurado que se adhiera estrictamente al esquema proporcionado.
Toda la información textual en el JSON, como títulos y etiquetas, debe estar en español.
No agregues explicaciones ni formato markdown a tu salida. Solo se permite el objeto JSON.

Aquí están las instrucciones específicas para cada página:

Página 1: "Indicadores acumulados del programa"
- El título principal debe ser "Indicadores acumulados del programa".
- Extrae los tres KPIs principales para el encabezado. Ejemplo: 'Ingresos', 'Completitud', 'Asistencia'.
- Para cada uno de los cuatro mercados (Lider, Express, SBA, CM):
    - Encuentra el porcentaje principal de completitud.
    - Extrae los datos para la tabla de estado ('Completado', 'Webinar', etc.).
    - Crea los datos para el gráfico de torta a partir de los porcentajes de la tabla de estado.
    - Extrae los datos para el gráfico de barras que muestra el rendimiento a través de los sub-mercados numerados (1-16).

Página 2: "Detalle por Formato"
- El título para esta página debe ser "Detalle por Formato".
- Para cada uno de los cuatro mercados (Lider, Express, SBA, CM):
    - Extrae las estadísticas generales para todo el mercado. Esto debe ser un array de objetos con las etiquetas: 'Completitud', 'Numero de participantes', 'Asistencia Webinar', y 'Asistencia Taller' y sus valores correspondientes.
    - Extrae el desglose de estadísticas para cada tienda individual ('local'). Para cada tienda, proporciona 'Asistencia' y 'Completitud'.

Página 3: "Destacados por Formato"
- El título principal para esta página debe ser "Destacados por Formato".
- Extrae la sección 'Destacados', resumiendo los reconocimientos clave. El título de la sección de destacados debe ser "Destacados". Para cada punto destacado, asigna un nombre de ícono apropiado de Google Material Symbols y asócialo con su mercado correspondiente. Si encuentras un destacado 'general' o uno que no esté claramente asociado a un mercado específico, asígnalo al mercado 'Lider'.

Aquí está el texto del reporte para analizar:
---
${text}
---
`;

export async function generateInfographicData(text: string): Promise<InfographicData> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: getPrompt(text),
      config: {
        responseMimeType: 'application/json',
        responseSchema: infographicSchema,
      },
    });

    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);

    // Basic validation to ensure the parsed object matches the expected structure
    if (!parsedData.page1 || !parsedData.page2 || !parsedData.page3) {
      throw new Error("Los datos generados no contienen las estructuras de página requeridas.");
    }

    return parsedData as InfographicData;
  } catch (error) {
    console.error("Error generating infographic data from Gemini:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("La IA no pudo generar un JSON válido. Por favor, revisa el contenido del PDF de entrada.");
    }
    throw new Error("Falló la comunicación con el servicio de IA.");
  }
}