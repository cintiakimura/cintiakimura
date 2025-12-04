import { GoogleGenAI, Modality } from "@google/genai";
import { FileData, SupportedLanguage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Common Helper to prepare file parts ---
const prepareFileParts = (files: FileData[]) => {
  return files.map(file => {
    let mimeType = file.type;
    if (file.name.endsWith('.md')) mimeType = 'text/plain';
    if (!mimeType) mimeType = 'text/plain';
    return {
      inlineData: {
        mimeType: mimeType,
        data: file.content
      }
    };
  });
};

export const generateResponse = async (
  question: string,
  files: FileData[],
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    const modelId = "gemini-2.5-flash";
    const fileParts = prepareFileParts(files);

    const prompt = `
You are a helpful and intelligent research assistant, similar to NotebookLM.
Use the provided documents to answer the user's question.
If the answer is not in the documents, state that clearly.
Cite the documents where possible (e.g. "According to [Filename]...").
Keep the tone professional, concise, and helpful.

Question: ${question}
`;
    
    const result = await ai.models.generateContentStream({
      model: modelId,
      contents: { parts: [...fileParts, { text: prompt }] },
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
    throw new Error("Failed to generate response.");
  }
};

// --- Studio Functions ---

// 1. Podcast Generation (Multi-speaker TTS)
export const generatePodcast = async (
  files: FileData[], 
  language: SupportedLanguage,
  customPrompt: string = ""
): Promise<string> => {
  try {
    // Step 1: Generate the script
    const scriptModel = "gemini-2.5-flash";
    const fileParts = prepareFileParts(files);
    
    const scriptPrompt = `
      Based on the attached documents, write a natural, engaging podcast script between two hosts, Joe and Jane.
      They should discuss the key insights, findings, and interesting points from the documents.
      The output MUST be in the target language: ${language}.
      
      User Instructions: ${customPrompt ? `Focus on the following: ${customPrompt}` : "Provide a general overview."}
      
      Format the output strictly as a conversation:
      Joe: [Text]
      Jane: [Text]
      Joe: [Text]
      ...
      
      Keep it under 300 words. Make it sound conversational, like a real podcast intro.
    `;

    const scriptResponse = await ai.models.generateContent({
      model: scriptModel,
      contents: { parts: [...fileParts, { text: scriptPrompt }] }
    });
    
    const scriptText = scriptResponse.text;
    if (!scriptText) throw new Error("Failed to generate podcast script");

    // Step 2: Convert Script to Audio
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: scriptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                    {
                        speaker: 'Joe',
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    },
                    {
                        speaker: 'Jane',
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
                    }
              ]
            }
        }
      }
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Failed to generate audio.");
    
    return `data:audio/wav;base64,${base64Audio}`;

  } catch (error) {
    console.error("Podcast Generation Error:", error);
    throw error;
  }
};

// 2. Video Generation (Veo)
export const generateVideo = async (
  files: FileData[], 
  language: SupportedLanguage,
  customPrompt: string = "",
  style: string = "Cinematic"
): Promise<string> => {
  try {
    // Step 1: Generate a visual prompt based on the content
    const promptModel = "gemini-2.5-flash";
    const fileParts = prepareFileParts(files);
    const summaryPrompt = `
      Create a highly descriptive visual prompt for a video background that represents the core theme of these documents. 
      The prompt should be for a generative video model. 
      
      Visual Style: ${style}
      Additional Requirements: ${customPrompt || "Focus on the main topic."}
      
      Describe a scene, style, lighting, and movement. 
      Keep it under 60 words. 
      Example: "A futuristic data center with neon lights pulsing, cinematic lighting, 4k, slow camera pan."
    `;
    
    const summaryResponse = await ai.models.generateContent({
        model: promptModel,
        contents: { parts: [...fileParts, { text: summaryPrompt }] }
    });
    const videoPrompt = summaryResponse.text || `Abstract digital visualization of knowledge, ${style} style.`;

    // Step 2: Call Veo
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned.");

    // Fetch the actual bytes to avoid CORS/Auth issues in <img> tags if using raw URI
    const videoUrlWithKey = `${downloadLink}&key=${process.env.API_KEY}`;
    return videoUrlWithKey;

  } catch (error) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};

// 3. Slides/Infographics (Text/Structure Generation)
export const generateSlides = async (
  files: FileData[], 
  language: SupportedLanguage,
  customPrompt: string = ""
): Promise<string> => {
    const fileParts = prepareFileParts(files);
    const prompt = `
    Create a presentation slide deck summarizing the uploaded documents.
    Language: ${language}.
    
    User Instructions: ${customPrompt || "Summarize the key findings."}
    
    Output strictly in Markdown format where '---' separates slides.
    
    Structure:
    # Slide 1: Title
    [Content]
    ---
    # Slide 2: Key Point 1
    [Content]
    ---
    # Slide 3: Key Point 2
    [Content]
    ---
    # Slide 4: Conclusion
    [Content]
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [...fileParts, { text: prompt }] }
    });

    return response.text || "Failed to generate slides.";
};
