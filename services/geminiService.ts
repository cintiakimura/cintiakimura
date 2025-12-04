import { GoogleGenAI } from "@google/genai";
import { FileData } from "../types";

// Initialize the client
// NOTE: In a real production app, you might want to proxy this through a backend 
// to avoid exposing the API key, but for this clone/demo, we use process.env directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateResponse = async (
  question: string,
  files: FileData[],
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    const modelId = "gemini-2.5-flash";

    // Prepare contents
    // We send the files as inline data parts along with the text prompt.
    // Gemini supports PDF, Text, etc. via inlineData.
    const parts = [];

    // Add files
    for (const file of files) {
        // Determine mime type to send to Gemini
        // For text files, we can often just send the text, but for PDF/Images we need inlineData.
        // We will treat all uploaded files as inlineData for simplicity and robustness with the 2.0+ models.
        // Ensure the mime type is supported. Common ones: application/pdf, text/plain, image/png, etc.
        let mimeType = file.type;
        
        // Fallback for markdown or others if browser didn't detect well
        if (file.name.endsWith('.md')) mimeType = 'text/plain';
        if (!mimeType) mimeType = 'text/plain';

        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: file.content
            }
        });
    }

    // Add the user's question as the last part
    const prompt = `
You are a helpful and intelligent research assistant, similar to NotebookLM.
Use the provided documents to answer the user's question.
If the answer is not in the documents, state that clearly.
Cite the documents where possible (e.g. "According to [Filename]...").
Keep the tone professional, concise, and helpful.

Question: ${question}
`;
    parts.push({ text: prompt });

    // Use streaming for better UX
    const result = await ai.models.generateContentStream({
      model: modelId,
      contents: { parts },
    });

    let fullText = "";
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }
    }

    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate response. Please check your API key and try again.");
  }
};