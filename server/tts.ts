import { ai } from "./gemini.js";

export async function synthesizeSpeech(
  text: string,
  voice: string = "Aoede",
  style: string = "Warm, sweet, friendly youthful female conversational tone"
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  // Sanitize text for TTS: remove markdown formatting like asterisks and code blocks
  const cleanText = text
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_#~]/g, "")
    .trim();

  if (!cleanText) {
    throw new Error("No pronounceable text provided");
  }

  // Limit to first 600 characters for snappy response
  const truncatedText = cleanText.length > 600 ? cleanText.slice(0, 597) + "..." : cleanText;

  // Selected cute female voices: Aoede (cute, bubbly, expressive), Kore (clear, warm, gentle)
  const validVoice = ["Aoede", "Kore", "Zephyr", "Puck", "Fenrir", "Charon"].includes(voice)
    ? voice
    : "Aoede";

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash-lite-tts",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: truncatedText,
            speechMetadata: {
              style: style,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: validVoice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data returned by TTS model");
  }

  return {
    audio: base64Audio,
    mimeType: "audio/wav",
  };
}
