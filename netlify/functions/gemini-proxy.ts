import { GoogleGenAI, Content } from "@google/genai";
import type { Context } from "@netlify/functions";

// System instructions define the AI's role and are kept securely on the server.
const SYSTEM_INSTRUCTIONS: { [key: string]: string } = {
    ar: "أنت مدرس ذكاء اصطناعي شخصي وخبير في منهج البكالوريا الجزائري. مهمتك هي مساعدة الطالب 'عادل'. تكيّف مع مستواه وقدّم شروحات بسيطة وواضحة. عند شرح التمارين، قدم الإجابة خطوة بخطوة. إذا رفع 'عادل' صورة، قم بتحليلها واشرح التمرين. كن محفزاً ومشجعاً دائماً. إذا لاحظت أنه يخطئ في موضوع معين، اقترح عليه بلطف دروساً أو تمارين إضافية لمراجعتها.",
    fr: "Tu es un tuteur IA personnel, expert du programme du baccalauréat algérien. Ton rôle est d'aider l'étudiant 'Adel'. Adapte-toi à son niveau et fournis des explications simples. Pour les exercices, explique la solution étape par étape. Si 'Adel' envoie une image, analyse-la. Sois motivant. Si tu remarques des erreurs récurrentes, suggère-lui gentiment de revoir certaines leçons.",
    en: "You are a personal AI tutor, an expert in the Algerian baccalaureate curriculum. Your mission is to help the student 'Adel'. Adapt to his level and provide simple explanations. Explain exercises step-by-step. If 'Adel' uploads an image, analyze it. Be motivating. If you notice recurring mistakes on a topic, gently suggest specific lessons or exercises for him to review."
};

/**
 * Sanitizes the chat history received from the client to ensure it's in a format
 * that the Gemini API expects. It removes temporary loading states and ensures
 * the conversation history starts with a 'user' role.
 */
const sanitizeHistory = (history: any[]): Content[] => {
    if (!Array.isArray(history)) return [];
    
    const sanitized = history
        .filter(m => !m.isLoading) // Remove any client-side loading indicators
        .map(({ role, parts }) => ({
            role,
            parts: parts.map((part: any) => {
                if (part.text) return { text: part.text };
                if (part.inlineData) return { inlineData: part.inlineData };
                return null;
            }).filter(Boolean)
        }))
        .filter(item => item.role && item.parts && item.parts.length > 0);

    // The Gemini API requires history to start with a 'user' role.
    if (sanitized.length > 0 && sanitized[0].role !== 'user') {
        return sanitized.slice(1);
    }
    return sanitized as Content[];
};

/**
 * The Netlify Function handler. This is the secure endpoint that the client app calls.
 * It now uses the modern Edge Function signature for proper streaming support.
 */
export default async (request: Request, context: Context): Promise<Response> => {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Securely access the API key from environment variables on Netlify's server.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "API key is not configured on the server." }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { prompt, language = 'ar', image, history = [] } = await request.json();

        const ai = new GoogleGenAI({ apiKey });
        
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: SYSTEM_INSTRUCTIONS[language],
            },
            history: sanitizeHistory(history),
        });

        const messagePayload: { parts: any[] } = { parts: [] };
        if (image) {
            messagePayload.parts.push({ inlineData: { mimeType: image.mimeType, data: image.b64 } });
        }
        if (prompt) {
            messagePayload.parts.push({ text: prompt });
        }

        if (messagePayload.parts.length === 0) {
             return new Response(JSON.stringify({ error: "Empty prompt and no image provided." }), {
                 status: 400,
                 headers: { 'Content-Type': 'application/json' }
             });
        }
        
        const stream = await chat.sendMessageStream({ message: messagePayload.parts });

        // Create a streaming response to send back to the client.
        const readableStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                for await (const chunk of stream) {
                    const text = chunk.text;
                    if (text) {
                        // Format the chunk as a Server-Sent Event (SSE).
                        const formattedChunk = `data: ${JSON.stringify({ text })}\n\n`;
                        controller.enqueue(encoder.encode(formattedChunk));
                    }
                }
                controller.close();
            },
        });

        return new Response(readableStream, {
            status: 200,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("Error in Gemini proxy:", error);
         if (error instanceof SyntaxError) {
             return new Response(JSON.stringify({ error: "Invalid request body." }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
