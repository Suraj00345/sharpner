import { GoogleGenAI } from "@google/genai";
const API_Key = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: API_Key });

async function main() {
  const interaction = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(interaction.output_text);
}

main();
