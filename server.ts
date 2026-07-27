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

      const prompt = `You are an expert OCR AI specializing in extracting data from Cambodian Identity Cards (អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ).
Examine the ID card image thoroughly and extract these EXACT fields:

1. "idCardNumber": The 9 or 10-digit National ID number. Look at the top right (e.g., "171107890" or "171135765"), or parse it from the bottom MRZ line starting with "IDKHM" (e.g. "IDKHM1711078906...").
2. "name": The cardholder's full name in Khmer script (e.g., "សឿន រ៉ាវីន") or Latin name if Khmer is unreadable.
3. "dob": Date of birth in DD.MM.YYYY format (e.g., "04.06.1988" or "22.06.2001") found after "ថ្ងៃខែឆ្នាំកំណើត:".
4. "address": Full address in Khmer (e.g., "ផ្ទះ158 ផ្លូវ/ក្រុម03 ភូមិចំការឬស្សី សង្កាត់ព្រែកព្រះស្ដេច ក្រុងបាត់ដំបង") found after "អាសយដ្ឋាន:".
5. "idExpiryDate": The expiry date in YYYY.MM.DD or DD.MM.YYYY format (e.g., "19.05.2026" or "2026.05.19") found after "ផុតកំណត់:" or "ដល់ថ្ងៃ".

Return ONLY a valid raw JSON object without markdown formatting:
{
  "idCardNumber": "string",
  "name": "string",
  "dob": "string",
  "address": "string",
  "idExpiryDate": "string"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

      const responseText = response.text || '';
      const cleanedJsonText = responseText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsedData = JSON.parse(cleanedJsonText);
      return res.json(parsedData);
    } catch (err: any) {
      console.error("Server ID Scan Error:", err);
      return res.status(500).json({ error: err.message || "Failed to parse ID card" });
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
