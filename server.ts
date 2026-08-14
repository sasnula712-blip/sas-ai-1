import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Requests will fail if key is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Extract human-friendly error message from nested SDK errors
function extractCleanErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  let raw = error?.message || error?.toString?.() || "";

  // Attempt to parse nested JSON error responses (e.g. from Google API 503/429)
  try {
    if (typeof raw === "string" && (raw.trim().startsWith("{") || raw.includes('"error":'))) {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = raw.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed?.error?.message) {
          raw = parsed.error.message;
          // In case of double-stringified JSON
          if (typeof raw === "string" && raw.trim().startsWith("{")) {
            const innerParsed = JSON.parse(raw);
            if (innerParsed?.error?.message) {
              raw = innerParsed.error.message;
            }
          }
        }
      }
    }
  } catch (e) {
    // Ignore JSON parsing failure and use raw string
  }

  if (
    raw.includes("503") ||
    raw.includes("UNAVAILABLE") ||
    raw.includes("high demand") ||
    raw.includes("overloaded")
  ) {
    return "The service is currently experiencing high demand. Automatic retry is active, or please try again in a moment.";
  }

  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota")) {
    return "Rate limit reached. Please wait a few seconds before trying again.";
  }

  if (raw.includes("API key not valid") || raw.includes("API_KEY_INVALID")) {
    return "API key is invalid or not configured. Please check your settings.";
  }

  return raw || "Could not generate response. Please try again.";
}

// Helper to sleep for retry delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Stream with automatic retry and model fallback
async function executeStreamWithRetry(
  ai: GoogleGenAI,
  contents: any[],
  config: any,
  modelsToTry: string[] = ["gemini-3.7-flash", "gemini-2.5-flash"]
) {
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    // Try up to 2 attempts per model with backoff
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const stream = await ai.models.generateContentStream({
          model: modelName,
          contents,
          config,
        });
        return { stream, modelName };
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || "";
        const isTransient =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("overloaded");

        console.warn(
          `[SAS AI] Attempt ${attempt} on model ${modelName} failed (${msg.slice(0, 120)}...)`
        );

        if (isTransient && attempt < 2) {
          await delay(attempt * 800); // Backoff before retry
          continue;
        }
        // If it's a model issue or exhausted attempt, break to next fallback model
        break;
      }
    }
  }

  throw lastError;
}

// Non-stream with automatic retry and model fallback
async function executeGenerateWithRetry(
  ai: GoogleGenAI,
  contents: any[],
  config: any,
  modelsToTry: string[] = ["gemini-3.7-flash", "gemini-2.5-flash"]
) {
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });
        return { response, modelName };
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || "";
        const isTransient =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("429") ||
          msg.includes("overloaded");

        console.warn(
          `[SAS AI] Non-stream Attempt ${attempt} on ${modelName} failed (${msg.slice(0, 120)}...)`
        );

        if (isTransient && attempt < 2) {
          await delay(attempt * 800);
          continue;
        }
        break;
      }
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      name: "SAS AI",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: "gemini-3.7-flash",
    });
  });

  // Streaming Chat API (SSE)
  app.post("/api/chat/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const {
        messages = [],
        systemInstruction,
        useSearch = false,
        temperature = 0.7,
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        res.write(`data: ${JSON.stringify({ error: "No messages provided." })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        return res.end();
      }

      const ai = getAI();

      // Format conversation contents
      const contents = messages.map((msg: any) => {
        const parts: any[] = [];

        // Include images if any
        if (Array.isArray(msg.images) && msg.images.length > 0) {
          for (const img of msg.images) {
            if (img.data) {
              const base64Data = img.data.includes(",")
                ? img.data.split(",")[1]
                : img.data;
              parts.push({
                inlineData: {
                  mimeType: img.mimeType || "image/jpeg",
                  data: base64Data,
                },
              });
            }
          }
        }

        if (msg.text) {
          parts.push({ text: msg.text });
        } else if (parts.length === 0) {
          parts.push({ text: " " });
        }

        return {
          role: msg.role === "user" ? "user" : "model",
          parts,
        };
      });

      const config: any = {
        temperature: typeof temperature === "number" ? temperature : 0.7,
      };

      if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
        config.systemInstruction = systemInstruction.trim();
      }

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const { stream: responseStream } = await executeStreamWithRetry(
        ai,
        contents,
        config
      );

      let accumulatedGroundingLinks: Array<{ title: string; uri: string }> = [];

      for await (const chunk of responseStream) {
        const text = chunk.text || "";

        // Check if grounding metadata exists
        const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && Array.isArray(chunks)) {
          for (const c of chunks) {
            if (c.web?.uri && c.web?.title) {
              if (!accumulatedGroundingLinks.some((l) => l.uri === c.web.uri)) {
                accumulatedGroundingLinks.push({
                  title: c.web.title,
                  uri: c.web.uri,
                });
              }
            }
          }
        }

        const dataPayload: any = { text };
        if (accumulatedGroundingLinks.length > 0) {
          dataPayload.groundingLinks = accumulatedGroundingLinks;
        }

        res.write(`data: ${JSON.stringify(dataPayload)}\n\n`);
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      console.error("[SAS AI] Stream Error:", error);
      const cleanMessage = extractCleanErrorMessage(error);
      res.write(`data: ${JSON.stringify({ error: cleanMessage })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  });

  // Non-streaming chat endpoint (fallback)
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        messages = [],
        systemInstruction,
        useSearch = false,
        temperature = 0.7,
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "No messages provided." });
      }

      const ai = getAI();

      const contents = messages.map((msg: any) => {
        const parts: any[] = [];
        if (Array.isArray(msg.images)) {
          for (const img of msg.images) {
            if (img.data) {
              const base64Data = img.data.includes(",")
                ? img.data.split(",")[1]
                : img.data;
              parts.push({
                inlineData: {
                  mimeType: img.mimeType || "image/jpeg",
                  data: base64Data,
                },
              });
            }
          }
        }
        if (msg.text) {
          parts.push({ text: msg.text });
        } else if (parts.length === 0) {
          parts.push({ text: " " });
        }
        return {
          role: msg.role === "user" ? "user" : "model",
          parts,
        };
      });

      const config: any = {
        temperature: typeof temperature === "number" ? temperature : 0.7,
      };

      if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
        config.systemInstruction = systemInstruction.trim();
      }

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const { response } = await executeGenerateWithRetry(ai, contents, config);

      const text = response.text || "";
      const groundingLinks: Array<{ title: string; uri: string }> = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        for (const c of chunks) {
          if (c.web?.uri && c.web?.title) {
            groundingLinks.push({
              title: c.web.title,
              uri: c.web.uri,
            });
          }
        }
      }

      return res.json({
        text,
        groundingLinks,
      });
    } catch (error: any) {
      console.error("[SAS AI] Non-stream Error:", error);
      return res.status(500).json({
        error: extractCleanErrorMessage(error),
      });
    }
  });

  // Song Generation Endpoint
  app.post("/api/song/generate", async (req, res) => {
    try {
      const {
        theme = "Love, friendship and memories",
        genre = "Sinhala Pop",
        mood = "Emotional & Uplifting",
        language = "Sinhala & English",
        vocalStyle = "Melodic Vocalist",
        tempoBpm = 110,
        audioDescription = "",
      } = req.body;

      const ai = getAI();

      const prompt = `You are SAS AI Music Composer & Lyricist Studio, created by Sasnula Dilum.
Create a complete, musically coherent, high-quality song structure with lyrics, chord progressions, tempo, and notes based on the following user requirements:

- Topic/Theme: "${theme}"
- Genre: "${genre}"
- Mood: "${mood}"
- Language: "${language}"
- Preferred Vocal Style: "${vocalStyle}"
- Target Tempo: ${tempoBpm} BPM
${audioDescription ? `- User Audio/Melody Input Context: "${audioDescription}"` : ""}

Generate a JSON object strictly matching this schema with NO markdown code block formatting (or valid JSON inside):
{
  "title": "Song Title in English",
  "titleSinhala": "ගීතයේ නම සිංහලෙන්",
  "genre": "${genre}",
  "mood": "${mood}",
  "tempoBpm": ${tempoBpm},
  "key": "C Major",
  "timeSignature": "4/4",
  "chords": ["C", "G", "Am", "F"],
  "structure": [
    {
      "section": "Intro",
      "chords": ["C", "G", "Am", "F"],
      "lyricsSinhala": "[වාද්‍ය ඛණ්ඩය / Musical Intro]",
      "lyricsEnglish": "[Instrumental Intro Groove]",
      "singlishLyrics": "[Instrumental]",
      "musicalCue": "Acoustic guitar arpeggio with soft percussion"
    },
    {
      "section": "Verse 1",
      "chords": ["C", "G", "Am", "F"],
      "lyricsSinhala": "සිංහල පද පේළි මෙහි ලියන්න (පළමු පදය)...",
      "lyricsEnglish": "English lyrical poetic translation / lyrics...",
      "singlishLyrics": "Singlish pronunciation for singing...",
      "musicalCue": "Gentle acoustic rhythm with steady bass"
    },
    {
      "section": "Chorus",
      "chords": ["F", "G", "Em", "Am"],
      "lyricsSinhala": "මනරම් ගීත තනුවක් සහිත ප්‍රධාන කෝරස් පද (Chorus)...",
      "lyricsEnglish": "Catchy, emotional main chorus lyrics...",
      "singlishLyrics": "Main chorus Singlish...",
      "musicalCue": "Full energetic chorus with backing harmonies and drum groove"
    },
    {
      "section": "Verse 2",
      "chords": ["C", "G", "Am", "F"],
      "lyricsSinhala": "දෙවන පද පේළිය...",
      "lyricsEnglish": "Second verse lyrics...",
      "singlishLyrics": "Second verse Singlish...",
      "musicalCue": "Melodic synth lead with rhythmic progression"
    },
    {
      "section": "Bridge",
      "chords": ["Dm", "G", "C", "Am"],
      "lyricsSinhala": "හැඟීම්බර අතරමැදි ගායනය (Bridge)...",
      "lyricsEnglish": "Emotional bridge building up...",
      "singlishLyrics": "Bridge singlish...",
      "musicalCue": "Building tension before final explosion"
    },
    {
      "section": "Outro",
      "chords": ["F", "G", "C", "C"],
      "lyricsSinhala": "ගීතය අවසන් වන මියුරු පද...",
      "lyricsEnglish": "Gentle fading outro lyrics...",
      "singlishLyrics": "Outro singlish...",
      "musicalCue": "Fading acoustic strum with soft resonance"
    }
  ],
  "productionNotes": "Production arrangement guidelines, instruments used (e.g. Acoustic Guitar, Bass, Tabla/Bongo, Synth Pad), mixing suggestions.",
  "tags": ["Sinhala", "Acoustic", "Pop", "SAS AI Music"]
}

Make sure chords are standard playable chords (e.g., C, D, E, F, G, A, B, Am, Em, Dm, Bm, C#m, F#m, G7, C7, D7, etc.).
Make Sinhala lyrics meaningful, rhyming, and culturally rich.
Output ONLY raw valid JSON.`;

      const { response } = await executeGenerateWithRetry(
        ai,
        [{ role: "user", parts: [{ text: prompt }] }],
        {
          temperature: 0.8,
          responseMimeType: "application/json",
        }
      );

      const rawText = response.text || "{}";
      let songData;
      try {
        songData = JSON.parse(rawText);
      } catch (e) {
        const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        songData = JSON.parse(cleaned);
      }

      songData.id = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      songData.createdAt = Date.now();

      return res.json(songData);
    } catch (error: any) {
      console.error("[SAS AI Song Studio] Error:", error);
      return res.status(500).json({ error: extractCleanErrorMessage(error) });
    }
  });

  // AI Image Generation Endpoint
  app.post("/api/generate-image", async (req, res) => {
    try {
      const {
        prompt,
        style = "Cinematic & Ultra Realistic",
        aspectRatio = "1:1",
      } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const ai = getAI();

      // Enhance prompt with creative styling
      const enhancementPrompt = `You are SAS AI Image Generator Studio created by Sasnula Dilum.
Enhance and expand this image prompt for visual art generation:
Original Prompt: "${prompt}"
Visual Style: "${style}"
Aspect Ratio: "${aspectRatio}"

Generate a visually stunning, masterfully detailed SVG artwork illustration representing this exact concept.
The SVG must:
1. Have viewBox="0 0 800 ${aspectRatio === '16:9' ? '450' : aspectRatio === '9:16' ? '1422' : '800'}"
2. Use vibrant, sophisticated gradients, atmospheric lighting, detailed shapes, glowing highlights, and layered depth.
3. Be high aesthetic quality, clean modern vectors, rich shadows, and artistic composition.
4. Output ONLY valid, standalone SVG code starting with <svg and ending with </svg>. Do not wrap in markdown quotes.`;

      const { response } = await executeGenerateWithRetry(
        ai,
        [{ role: "user", parts: [{ text: enhancementPrompt }] }],
        { temperature: 0.7 }
      );

      let svgCode = response.text || "";
      if (svgCode.includes("<svg")) {
        const start = svgCode.indexOf("<svg");
        const end = svgCode.lastIndexOf("</svg>") + 6;
        svgCode = svgCode.substring(start, end);
      } else {
        // Fallback procedural visual generator
        const width = 800;
        const height = aspectRatio === '16:9' ? 450 : aspectRatio === '9:16' ? 1422 : 800;
        svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1e1b4b" />
              <stop offset="50%" stop-color="#312e81" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>
            <radialGradient id="glow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg)" />
          <circle cx="${width / 2}" cy="${height / 2 - 50}" r="220" fill="url(#glow)" />
          <text x="${width / 2}" y="${height / 2}" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">${prompt.slice(0, 40)}</text>
          <text x="${width / 2}" y="${height / 2 + 40}" font-family="system-ui, sans-serif" font-size="14" fill="#93c5fd" text-anchor="middle">Generated by SAS AI Studio • Sasnula Dilum</text>
        </svg>`;
      }

      // Convert SVG to data URI
      const base64Svg = Buffer.from(svgCode).toString("base64");
      const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

      return res.json({
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        prompt,
        style,
        aspectRatio,
        imageUrl: dataUri,
        createdAt: Date.now(),
      });
    } catch (error: any) {
      console.error("[SAS AI Image Studio] Error:", error);
      return res.status(500).json({ error: extractCleanErrorMessage(error) });
    }
  });

  // AI Video Storyboard & Script Generator Endpoint
  app.post("/api/video/storyboard", async (req, res) => {
    try {
      const {
        idea = "A futuristic sci-fi city in Sri Lanka with flying vehicles and glowing lotus towers",
        genre = "Cinematic Sci-Fi",
        aspectRatio = "16:9",
        durationSeconds = 60,
      } = req.body;

      const ai = getAI();

      const prompt = `You are SAS AI Cinematic Video Director Studio, created by Sasnula Dilum.
Create a rich, professional multi-scene video storyboard, scene-by-scene camera breakdown, audio cues, and voiceover script based on:

Concept: "${idea}"
Genre: "${genre}"
Aspect Ratio: "${aspectRatio}"
Duration: ${durationSeconds} seconds

Output a strictly valid JSON object with NO markdown formatting matching this schema:
{
  "title": "Cinematic Title",
  "logline": "1-sentence compelling elevator pitch",
  "aspectRatio": "${aspectRatio}",
  "genre": "${genre}",
  "totalDurationSeconds": ${durationSeconds},
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSeconds": 10,
      "shotType": "Wide Aerial Drone Shot",
      "visualPrompt": "Detailed visual prompt describing lighting, composition, colors, subjects for video generation tools (Runway/Luma/Sora)...",
      "actionDescription": "What happens in the scene frame by frame...",
      "dialogueOrVoiceover": "Cinematic voiceover or character dialogue...",
      "soundtrackAndAudio": "Audio atmosphere, SFX (e.g. ambient drone, whoosh, cinematic strings)"
    },
    {
      "sceneNumber": 2,
      "durationSeconds": 15,
      "shotType": "Medium Tracking Shot",
      "visualPrompt": "Detailed visual prompt for scene 2...",
      "actionDescription": "Action details...",
      "dialogueOrVoiceover": "Voiceover line...",
      "soundtrackAndAudio": "SFX details..."
    },
    {
      "sceneNumber": 3,
      "durationSeconds": 15,
      "shotType": "Extreme Close-Up",
      "visualPrompt": "Detailed visual prompt for scene 3...",
      "actionDescription": "Action details...",
      "dialogueOrVoiceover": "Voiceover line...",
      "soundtrackAndAudio": "SFX details..."
    },
    {
      "sceneNumber": 4,
      "durationSeconds": 20,
      "shotType": "Epic Orbiting Hero Shot",
      "visualPrompt": "Climactic visual prompt...",
      "actionDescription": "Climax and resolution...",
      "dialogueOrVoiceover": "Final impactful conclusion line...",
      "soundtrackAndAudio": "Epic orchestral swell and title fade"
    }
  ]
}

Output ONLY valid raw JSON.`;

      const { response } = await executeGenerateWithRetry(
        ai,
        [{ role: "user", parts: [{ text: prompt }] }],
        {
          temperature: 0.75,
          responseMimeType: "application/json",
        }
      );

      const rawText = response.text || "{}";
      let storyboard;
      try {
        storyboard = JSON.parse(rawText);
      } catch (e) {
        const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        storyboard = JSON.parse(cleaned);
      }

      storyboard.id = `video-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      storyboard.createdAt = Date.now();

      return res.json(storyboard);
    } catch (error: any) {
      console.error("[SAS AI Video Studio] Error:", error);
      return res.status(500).json({ error: extractCleanErrorMessage(error) });
    }
  });

  // Vite middleware in dev or static serving in production
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
    console.log(`SAS AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
