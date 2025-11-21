import { GoogleGenAI, Type } from "@google/genai";
import { PlanType, AIAnalysisResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLead = async (
  plan: PlanType,
  budget: number,
  description: string
): Promise<AIAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Actúa como el Director Comercial de 'Leone Agencia', una agencia de desarrollo web premium.
      
      NUESTROS PRECIOS BASE:
      - Single Page (Wordpress): $300 USD
      - Multipage (Wordpress): $600 USD
      - E-commerce (Wordpress): $900 USD
      - Personalizado: Se cotiza aparte.
      
      DATOS DEL CLIENTE:
      Plan Solicitado: ${plan}
      Presupuesto del Cliente: $${budget}
      Descripción: ${description}
      
      TAREA:
      Analiza la viabilidad. Si el presupuesto es bajo, genera una alerta amable pero clara explicando que el precio base es mayor.
      Da un puntaje de viabilidad (0-100).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alert: {
              type: Type.STRING,
              description: "Mensaje de advertencia si el presupuesto es bajo (en español).",
            },
            viabilityScore: {
              type: Type.NUMBER,
              description: "Puntaje de 0 a 100.",
            },
            suggestedPlan: {
              type: Type.STRING,
              description: "Sugerencia alternativa.",
            }
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      alert: "Error en análisis IA - Revisar Manualmente",
      viabilityScore: 50
    };
  }
};

export const generateFollowUpEmail = async (
  clientName: string,
  projectType: string,
  reason: string,
  currentStatus: string
): Promise<{subject: string, body: string}> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Eres el Project Manager de 'Leone Agencia'. Redacta un correo para un cliente.
      
      Cliente: ${clientName}
      Proyecto: ${projectType}
      Estado Actual del Proyecto: ${currentStatus}
      
      MOTIVO DEL CORREO: ${reason}
      
      Instrucciones de Estilo:
      - Usa un tono profesional, confiable y estructurado.
      - Si es "Reporte de Estado", menciona que estamos avanzando según lo planeado y detalla brevemente (usa placeholders como [Detalle 1], [Detalle 2] para que yo los llene).
      - Si es reclamo de pago o info, sé amable pero firme para no retrasar la fecha de entrega.
      - Firma como: "El equipo de Leone Agencia".
      
      FORMATO JSON REQUERIDO:
      {
        "subject": "El asunto del correo",
        "body": "El cuerpo del correo en texto plano (sin markdown)"
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING }
            }
        }
      }
    });

    const text = response.text;
    if(!text) throw new Error("No content");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Email Error:", error);
    return { subject: "Error", body: "No se pudo generar el correo." };
  }
};