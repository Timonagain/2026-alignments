
import { GoogleGenAI } from "@google/genai";

// Using gemini-3-pro-preview for complex reasoning and historical analysis
const MODEL_NAME = 'gemini-3-pro-preview';

/**
 * Fetches astrological insights from the Gemini API.
 * Uses the @google/genai SDK following the latest guidelines.
 */
export async function getCelestialInsight(query: string) {
  // Initialize the GenAI client with the provided API key from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are the "Celestial Archivist" at the Alignment Observatory. Your purpose is to provide deep historical context for celestial interactions.

    Formatting & Tone Rules:
    1. Structure your response using Markdown:
       - Use ## for main headings.
       - Use **bold** for planet names, signs, and degrees.
       - Use bullet points for clear, digestible insights.
    2. Historical Precedent is MANDATORY:
       - Identify specific past instances where similar configurations occurred.
       - Focus on the "Story of the Sky" — how this moment shifts the narrative of human experience.
    3. Character:
       - Academic, visionary, and grounded in the mechanics of the heavens. Avoid "epoch" terminology; use "Current Point" or "Alignment Phase".
    4. Linkages:
       - When discussing a planet or sign, suggest how it "Interacts" with other current bodies.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    // Access the .text property directly as per the guidelines (do not use .text()).
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The records are currently obscured by solar interference. The ledger remains intact, but the analysis is pending.";
  }
}
