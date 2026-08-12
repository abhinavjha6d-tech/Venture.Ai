import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export async function POST(request: Request) {
  try {
    const { contents, systemInstruction } = await request.json();

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Server AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}