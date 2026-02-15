import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// IMPORTANT: The API key must be provided via environment variable.
const apiKey = process.env.API_KEY || ''; 
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Analyzes an image url to generate tags and a description.
 * Note: Fetching the image client-side to base64 might fail due to CORS on some images.
 * Ideally, this is done server-side.
 */
export const analyzeImage = async (imageUrl: string): Promise<{ description: string; tags: string[] }> => {
  if (!ai) {
    console.warn("Gemini API Key is missing.");
    return { 
      description: "AI analysis unavailable (Missing API Key).", 
      tags: [] 
    };
  }

  try {
    // Fetch image data and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64String = base64Data.split(',')[1];
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    // Use gemini-3-flash-preview for multimodal tasks (image + text)
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Analyze this image. 
      Provide a short, engaging description (max 2 sentences) suitable for a Pinterest caption.
      Then, provide a list of 5 relevant hashtags or keywords.
    `;

    const result = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64String,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
            },
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
        },
      }
    });

    const text = result.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      description: "Could not analyze image at this time.",
      tags: []
    };
  }
};