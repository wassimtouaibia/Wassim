import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set. Please configure it in the Secrets / Settings panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API endpoint to search activities in an area
app.post("/api/activities", async (req, res) => {
  try {
    const { location, category, duration, costPreference, coords } = req.body;
    let resolvedLocation = location;

    const ai = getGeminiClient();

    if (coords && typeof coords.latitude === "number" && typeof coords.longitude === "number") {
      const geoPrompt = `You are an expert geographer. Translate latitude ${coords.latitude} and longitude ${coords.longitude} into the closest city, town, or neighborhood name. 
Return ONLY the formatted name of the place, with its state/country (e.g. 'Paris, France', 'Austin, TX', 'Shibuya, Tokyo'). Do not write any other explanation, punctuation, or words.`;
      const geoResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: geoPrompt,
      });
      resolvedLocation = geoResponse.text?.trim() || `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`;
    }

    if (!resolvedLocation || typeof resolvedLocation !== "string") {
      res.status(400).json({ error: "Location or coordinates are required." });
      return;
    }

    const prompt = `Generate 6 to 8 realistic, engaging local activities and points of interest for the area: "${resolvedLocation}".
${category && category !== "all" ? `Prioritize activities in the "${category}" category.` : "Provide a balanced, diverse selection across multiple categories (outdoor, culture, food, family, adventure, relaxation)."}
${duration ? `Include options suitable for: ${duration}.` : ""}
${costPreference ? `Align with budget level: ${costPreference}.` : ""}

Generate coordinates as relative decimal offsets between -0.15 and 0.15 relative to a central (0,0) point, so they can be plotted on a 2D map. Ensure they are distributed widely across the quadrant (not all in one spot).`;

    const systemInstruction = `You are a seasoned local guide, urban explorer, and travel writer.
Generate highly detailed, realistic, and authentic activities for the user's specified location.
The category field MUST be exactly one of: 'outdoor', 'culture', 'food', 'family', 'adventure', 'relaxation'.
The cost field MUST be exactly one of: 'Free', '$', '$$', '$$$'.
Generate latitude and longitude as relative decimal offsets from the center of the area. Each offset must be between -0.15 and +0.15 (e.g. 0.082, -0.045) to allow 2D map plotting.
Ensure each activity contains realistic metadata, ratings (4.0 to 5.0), ratings count, helpful tips, and an intriguing 'localSecret' (a hidden detail, best viewpoint, historical anecdote, or secret ordering tip).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of recommended activities for the local area.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique short string ID (e.g., act-1, act-2)." },
              name: { type: Type.STRING, description: "Clear, attractive name of the activity or spot." },
              category: {
                type: Type.STRING,
                description: "Must be exactly one of: outdoor, culture, food, family, adventure, relaxation."
              },
              description: { type: Type.STRING, description: "A compelling 2-3 sentence description highlighting what makes it special." },
              address: { type: Type.STRING, description: "Approximate realistic address or landmark location." },
              latitude: { type: Type.NUMBER, description: "Relative latitudinal offset (between -0.15 and 0.15) from center." },
              longitude: { type: Type.NUMBER, description: "Relative longitudinal offset (between -0.15 and 0.15) from center." },
              cost: { type: Type.STRING, description: "Free, $, $$, or $$$" },
              duration: { type: Type.STRING, description: "Approximate duration (e.g. 1-2 hours, Half-day, 45 mins)." },
              rating: { type: Type.NUMBER, description: "Average visitor rating between 4.0 and 5.0." },
              reviewsCount: { type: Type.INTEGER, description: "Approximate count of reviews (e.g. 120, 2450)." },
              bestTime: { type: Type.STRING, description: "Recommended time to visit (e.g., Morning, Sunset, Evening, Midday)." },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2-3 highly specific insider tips for visiting."
              },
              localSecret: { type: Type.STRING, description: "A lesser-known fact, hidden viewpoint, or local legend about this place." }
            },
            required: [
              "id",
              "name",
              "category",
              "description",
              "address",
              "latitude",
              "longitude",
              "cost",
              "duration",
              "rating",
              "reviewsCount",
              "bestTime",
              "tips"
            ]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI model.");
    }

    const activities = JSON.parse(text.trim());
    res.json({ location: resolvedLocation, activities });
  } catch (error: any) {
    console.error("Error generating activities:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating activities." });
  }
});

// Chat support endpoint to converse about the area or activities
app.post("/api/activities/chat", async (req, res) => {
  try {
    const { messages, location, currentActivities } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required." });
      return;
    }

    const ai = getGeminiClient();

    const formattedHistory = messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    // The user's latest query is the last message
    const lastMessage = formattedHistory[formattedHistory.length - 1];
    const previousHistory = formattedHistory.slice(0, -1);

    const systemInstruction = `You are an expert local guide for "${location || "the user's searched area"}".
You are assisting a visitor planning their day using a list of local activities.
Here are the current recommended activities in this area for reference:
${JSON.stringify(currentActivities || [])}

Provide friendly, warm, concise, and helpful responses.
Help the user decide which activities to pair together, suggest food options nearby, answer specific questions about the tips or local secrets, or propose customized morning/afternoon plans. Keep your responses engaging and concise (under 150 words).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...previousHistory.map(h => ({ role: h.role, parts: h.parts })),
        { role: "user" as const, parts: [{ text: `System context: ${systemInstruction}\n\nUser request: ${lastMessage.parts[0].text}` }] }
      ],
      config: {
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in local advisor chat:", error);
    res.status(500).json({ error: error.message || "An error occurred in the advisory session." });
  }
});

// Serve static assets and hook up Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
