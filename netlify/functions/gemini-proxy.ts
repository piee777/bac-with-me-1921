import { GoogleGenAI, Content, Type, Part } from "@google/genai";
import type { Context } from "@netlify/functions";

// --- System Instructions ---
const SYSTEM_INSTRUCTIONS: { [key: string]: string } = {
    ar: "أنت مدرس ذكاء اصطناعي شخصي وخبير في منهج البكالوريا الجزائري. مهمتك هي مساعدة الطالب 'عادل'. تكيّف مع مستواه وقدّم شروحات بسيطة وواضحة. عند شرح التمارين، قدم الإجابة خطوة بخطوة. إذا رفع 'عادل' صورة، قم بتحليلها واشرح التمرين. كن محفزاً ومشجعاً دائماً. إذا لاحظت أنه يخطئ في موضوع معين، اقترح عليه بلطف دروساً أو تمارين إضافية لمراجعتها.",
    fr: "Tu es un tuteur IA personnel, expert du programme du baccalauréat algérien. Ton rôle est d'aider l'étudiant 'Adel'. Adapte-toi à son niveau et fournis des explications simples. Pour les exercices, explique la solution étape par étape. Si 'Adel' envoie une image, analyse-la. Sois motivant. Si tu remarques des erreurs récurrentes, suggère-lui gentiment de revoir certaines leçons.",
    en: "You are a personal AI tutor, an expert in the Algerian baccalaureate curriculum. Your mission is to help the student 'Adel'. Adapt to his level and provide simple explanations. Explain exercises step-by-step. If 'Adel' uploads an image, analyze it. Be motivating. If you notice recurring mistakes on a topic, gently suggest specific lessons or exercises for him to review."
};

// --- Helper Functions ---
const sanitizeHistory = (history: any[]): Content[] => {
    if (!Array.isArray(history)) return [];
    const sanitized = history.filter(m => !m.isLoading).map(({ role, parts }) => ({
        role,
        parts: parts.map((part: any) => part.text ? { text: part.text } : { inlineData: part.inlineData }).filter(Boolean)
    })).filter(item => item.role && item.parts && item.parts.length > 0);
    if (sanitized.length > 0 && sanitized[0].role !== 'user') return sanitized.slice(1);
    return sanitized as Content[];
};

const createStreamResponse = (stream: AsyncGenerator<any>): Response => {
    const readableStream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            for await (const chunk of stream) {
                if (chunk.text) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
                }
            }
            controller.close();
        },
    });
    return new Response(readableStream, { headers: { "Content-Type": "text/event-stream" } });
};


// --- Action Handlers ---

const handleChat = async (ai: GoogleGenAI, body: any): Promise<Response> => {
    const { prompt, language = 'ar', image, history = [] } = body;
    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { 
            systemInstruction: SYSTEM_INSTRUCTIONS[language],
            thinkingConfig: { thinkingBudget: 0 } 
        },
        history: sanitizeHistory(history),
    });

    if (!prompt && !image) {
        return new Response(JSON.stringify({ error: "Empty prompt." }), { status: 400 });
    }

    let stream;

    // If we only have text, send a simple string for efficiency and robustness.
    if (prompt && !image) {
        stream = await chat.sendMessageStream({ message: prompt });
    } else {
        // Otherwise, construct the parts array for multi-modal input.
        const messageParts: Part[] = [];
        if (image) {
            messageParts.push({ inlineData: { mimeType: image.mimeType, data: image.b64 } });
        }
        if (prompt) {
            messageParts.push({ text: prompt });
        }
        stream = await chat.sendMessageStream({ message: messageParts });
    }
    
    return createStreamResponse(stream);
};

const handleGenerateExam = async (ai: GoogleGenAI, body: any): Promise<Response> => {
    const { topic, questionCount, difficulty } = body;
    const prompt = `بصفتك خبيرًا في إنشاء الاختبارات، قم بإنشاء ${questionCount} أسئلة من نوع الاختيار من متعدد (MCQ) حول الموضوع التالي: "${topic}". يجب أن تكون الأسئلة بمستوى صعوبة "${difficulty}" ومناسبة لطلاب البكالوريا في الجزائر. يجب أن يكون الإخراج عبارة عن كائن JSON واحد يحتوي على مفتاح "exam"، وقيمته هي مصفوفة من كائنات الأسئلة. لكل سؤال، قدم 3 خيارات، واحد منها فقط صحيح. استنتج اسم المادة الدراسية (مثل الرياضيات، الفيزياء) من الموضوع وأدرجه في الحقل "subject" لكل سؤال. قم بتعيين قيمة الحقل "type" إلى "mcq" لكل سؤال. لا تقم بتضمين أي markdown formatting.`;

    const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
        // responseSchema is not supported in streaming, so the prompt must be very specific.
        config: { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 } 
        }
    });

    return createStreamResponse(stream);
};


const handleGenerateStudyPlan = async (ai: GoogleGenAI, body: any): Promise<Response> => {
    const { subjects, days, hours, goal } = body;
    const prompt = `
        أنت خبير في التخطيط الدراسي لطلاب البكالوريا. قم بإنشاء خطة مراجعة أسبوعية مخصصة بناءً على المعلومات التالية:
        - المواد المستهدفة: ${subjects.join(', ')}
        - أيام المراجعة المتاحة: ${days.join(', ')}
        - عدد ساعات المراجعة يومياً: ${hours}
        - الهدف الأساسي: "${goal}"

        الخطة يجب أن تكون واقعية، موزعة بشكل جيد، وتتضمن مهامًا محددة لكل جلسة دراسية (مثل مراجعة درس معين أو حل تمارين). قدم الخطة بتنسيق Markdown واضح ومنظم.
    `;

    const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { 
            thinkingConfig: { thinkingBudget: 0 } 
        }
    });
    return createStreamResponse(stream);
};


// --- Main Handler ---

export default async (request: Request, context: Context): Promise<Response> => {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: "API key is not configured." }), { status: 500 });
    }

    try {
        const body = await request.json();
        const { action = 'chat' } = body;
        const ai = new GoogleGenAI({ apiKey });

        switch (action) {
            case 'generateExam':
                return handleGenerateExam(ai, body);
            case 'generateStudyPlan':
                return handleGenerateStudyPlan(ai, body);
            case 'chat':
            default:
                return handleChat(ai, body);
        }
    } catch (error) {
        console.error("Error in Gemini proxy:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
};