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

      const prompt = `You are a professional OCR engine specializing in Cambodian Identity Cards (អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ).
Extract the following exact fields from the provided ID card image:
1. "idCardNumber": The 9 or 10-digit ID number (អត្តសញ្ញាណប័ណ្ណ) e.g., "171135765" or "010234567".
2. "name": Full name in Khmer script e.g., "ពេជ្រ រចនា" or "ចាន់ ម៉ារី".
3. "dob": Date of birth in DD.MM.YYYY format e.g., "22.06.2001".
4. "address": Full address in Khmer script e.g., "ផ្ទះ11 ផ្លូវ/ក្រុម01 ភូមិចំការឬស្សី សង្កាត់ព្រែកព្រះស្ដេច ក្រុងបាត់ដំបង".
5. "idExpiryDate": Expiry date in YYYY.MM.DD or DD.MM.YYYY format e.g., "2031.06.22".

Return STRICTLY a JSON object with no markdown formatting or markdown wrappers:
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
