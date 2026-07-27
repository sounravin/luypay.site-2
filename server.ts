import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // API route for Cambodian National ID OCR using Gemini AI
  app.post("/api/scan-id", async (req, res) => {
    try {
      const { image } = req.body; // base64 data URL
      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is missing from environment" });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Clean base64 string and extract MIME type
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const mimeTypeMatch = image.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

      const prompt = `You are a high-precision OCR engine specializing in Cambodian Identity Cards (អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ).
Examine the ID card image thoroughly and extract these EXACT fields:

1. "idCardNumber": The 9-digit or 10-digit National ID number (e.g., "171107890" or "171135765"). Look at the top right of the card, or the bottom MRZ zone starting with "IDKHM". Convert all Khmer numerals to standard 0-9 digits.
2. "name": The cardholder's full name in Khmer script (e.g. "សឿន រ៉ាវីន" or "ចាន់ ម៉ារី").
3. "dob": Date of birth in DD.MM.YYYY format (e.g. "04.06.1988" or "22.06.2001") found after "ថ្ងៃខែឆ្នាំកំណើត:".
4. "address": Full address in Khmer script (e.g. "ផ្ទះ158 ផ្លូវ/ក្រុម03 ភូមិចំការឬស្សី សង្កាត់ព្រែកព្រះស្ដេច ក្រុងបាត់ដំបង") found after "អាសយដ្ឋាន:".
5. "idExpiryDate": Expiry date in DD.MM.YYYY format (e.g. "19.05.2026" or "31.12.2031") found after "ដល់ថ្ងៃ" or "ផុតកំណត់:".

Rules:
- Convert any Khmer numerals (០,១,២,៣,៤,៥,៦,៧,៨,៩) to Arabic numerals (0,1,2,3,4,5,6,7,8,9).
- Return STRICTLY a valid JSON object without markdown formatting or code blocks:
{
  "idCardNumber": "string",
  "name": "string",
  "dob": "string",
  "address": "string",
  "idExpiryDate": "string"
}`;

      let responseText = '';
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType: mimeType
                    }
                  },
                  { text: prompt }
                ]
              }
            ]
          });
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (mErr: any) {
          // Model unavailable or quota reached, continue to next model/fallback
        }
      }

      if (!responseText) {
        return res.json({ fallbackToClient: true });
      }

      const cleanedJsonText = responseText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsedData = JSON.parse(cleanedJsonText);
      return res.json(parsedData);
    } catch (err: any) {
      console.warn("Server ID Scan notice:", err?.message || err);
      return res.json({ fallbackToClient: true });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for dev / static serve for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
