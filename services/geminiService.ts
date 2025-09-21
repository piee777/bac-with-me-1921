import { GoogleGenAI, Content, Part } from "@google/genai";
import { ChatMessage } from '../types';

// --- Environment Detection ---
// This checks if the API_KEY is available in the environment.
// In local/dev environments like the one you are using, it will be true.
// On the deployed Netlify frontend, it will be false.
const IS_DEV = !!process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (IS_DEV) {
    try {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI in DEV mode:", error);
        // Fallback to proxy if initialization fails
    }
}

// =================================================================================
// PROD MODE: NETLIFY PROXY FUNCTIONS
// =================================================================================

async function* streamProxyRequest(action: string, body: object): AsyncGenerator<{ text: string }> {
    try {
        const response = await fetch('/.netlify/functions/gemini-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, ...body }),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
            throw new Error(errorData.error || `Failed to perform action: ${action}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                if (buffer.length > 0) {
                     try { yield JSON.parse(buffer.substring(buffer.indexOf('{'))); } catch (e) { /* ignore */ }
                }
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.substring(6);
                    if (jsonStr) {
                        try {
                            yield JSON.parse(jsonStr);
                        } catch (e) {
                            console.error("Error parsing JSON chunk from stream:", e, "Chunk:", jsonStr);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error streaming from proxy for action "${action}":`, error);
        throw error;
    }
}


// =================================================================================
// DEV MODE: DIRECT API CALL FUNCTIONS
// =================================================================================

const createSystemInstruction = (userName: string, lang: string): string => {
    const instructions = {
        ar: `أنت مدرس ذكاء اصطناعي شخصي وخبير في منهج البكالوريا الجزائري. مهمتك هي مساعدة الطالب '${userName}'. تكيّف مع مستواه وقدّم شروحات بسيطة وواضحة. عند شرح التمارين، قدم الإجابة خطوة بخطوة. إذا رفع '${userName}' صورة، قم بتحليلها واشرح التمرين. كن محفزاً ومشجعاً دائماً. إذا لاحظت أنه يخطئ في موضوع معين، اقترح عليه بلطف دروساً أو تمارين إضافية لمراجعتها.`,
        fr: `Tu es un tuteur IA personnel, expert du programme du baccalauréat algérien. Ton rôle est d'aider l'étudiant '${userName}'. Adapte-toi à son niveau et fournis des explications simples. Pour les exercices, explique la solution étape par étape. Si '${userName}' envoie une image, analyse-la. Sois motivant. Si tu remarques des erreurs récurrentes, suggère-lui gentiment de revoir certaines leçons.`,
        en: `You are a personal AI tutor, an expert in the Algerian baccalaureate curriculum. Your mission is to help the student '${userName}'. Adapt to his level and provide simple explanations. Explain exercises step-by-step. If '${userName}' uploads an image, analyze it. Be motivating. If you notice recurring mistakes on a topic, gently suggest specific lessons or exercises for him to review.`
    };
    return instructions[lang as keyof typeof instructions] || instructions['ar'];
};


const sanitizeHistory = (history: any[]): Content[] => {
    if (!Array.isArray(history)) return [];
    const sanitized = history.filter(m => !m.isLoading).map(({ role, parts }) => ({
        role,
        parts: parts.map((part: any) => part.text ? { text: part.text } : { inlineData: part.inlineData }).filter(Boolean)
    })).filter(item => item.role && item.parts && item.parts.length > 0);
    if (sanitized.length > 0 && sanitized[0].role !== 'user') return sanitized.slice(1);
    return sanitized as Content[];
};

async function* handleDirectChat(
    ai: GoogleGenAI,
    body: { prompt: string; language: string; image?: any; history: any[]; userName: string; }
): AsyncGenerator<{ text: string }> {
    const { prompt, language = 'ar', image, history = [], userName } = body;
    const systemInstruction = createSystemInstruction(userName, language);
    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction, thinkingConfig: { thinkingBudget: 0 } },
        history: sanitizeHistory(history),
    });
    if (!prompt && !image) throw new Error("Empty prompt.");

    let messagePayload: { message: string | Part[] };
    if (prompt && !image) {
        messagePayload = { message: prompt };
    } else {
        const messageParts: Part[] = [];
        if (image) messageParts.push({ inlineData: { mimeType: image.mimeType, data: image.b64 } });
        if (prompt) messageParts.push({ text: prompt });
        messagePayload = { message: messageParts };
    }
    
    const stream = await chat.sendMessageStream(messagePayload);
    for await (const chunk of stream) {
        yield { text: chunk.text };
    }
}

async function* handleDirectExam(
    ai: GoogleGenAI,
    body: { topic: string; questionCount: number; difficulty: string }
): AsyncGenerator<{ text: string }> {
    const { topic, questionCount, difficulty } = body;
    const prompt = `بصفتك خبيرًا في إنشاء الاختبارات، قم بإنشاء ${questionCount} أسئلة من نوع الاختيار من متعدد (MCQ) حول الموضوع التالي: "${topic}". 
    يجب أن تكون الأسئلة بمستوى صعوبة "${difficulty}" ومناسبة لطلاب البكالوريا في الجزائر. 
    يجب أن يكون الإخراج عبارة عن كائن JSON واحد يحتوي على مفتاح "exam"، وقيمته هي مصفوفة من كائنات الأسئلة. 
    لكل سؤال، يجب أن يحتوي الكائن على:
    - "question": (string) نص السؤال.
    - "options": (array) مصفوفة من 3 كائنات للخيارات.
    - "subject": (string) اسم المادة المستنتج من الموضوع.
    - "type": (string) بقيمة "mcq".
    
    كل كائن في مصفوفة "options" يجب أن يحتوي على:
    - "text": (string) نص الخيار.
    - "is_correct": (boolean) تكون true لخيار واحد فقط، و false للآخرين.

    مثال على بنية سؤال واحد:
    { "question": "...", "options": [{ "text": "...", "is_correct": false }, { "text": "...", "is_correct": true }, { "text": "...", "is_correct": false }], "subject": "...", "type": "mcq" }

    لا تقم بتضمين أي markdown formatting.`;
    
    const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } }
    });
    for await (const chunk of stream) {
        yield { text: chunk.text };
    }
}

async function* handleDirectStudyPlan(
    ai: GoogleGenAI,
    body: { subjects: string[]; days: string[]; hours: string; goal: string }
): AsyncGenerator<{ text: string }> {
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
        config: { thinkingConfig: { thinkingBudget: 0 } }
    });
     for await (const chunk of stream) {
        yield { text: chunk.text };
    }
}

// =================================================================================
// EXPORTED API FUNCTIONS
// =================================================================================

export const getTutorResponse = (
    prompt: string, 
    language: 'ar' | 'fr' | 'en',
    history: ChatMessage[],
    image?: { b64: string, mimeType: string }
): Promise<AsyncGenerator<{ text: string }>> => {
    const userName = localStorage.getItem('userName') || 'الطالب';

    if (IS_DEV && ai) {
        return Promise.resolve(handleDirectChat(ai, { prompt, language, image, history, userName }));
    }
    return Promise.resolve(streamProxyRequest('chat', { prompt, language, image, history: history.filter(m => !m.isLoading), userName }));
};

export const generateExam = (
    topic: string, 
    questionCount: number, 
    difficulty: 'easy' | 'medium' | 'hard'
): Promise<AsyncGenerator<{ text: string }>> => {
    if (IS_DEV && ai) {
        return Promise.resolve(handleDirectExam(ai, { topic, questionCount, difficulty }));
    }
    return Promise.resolve(streamProxyRequest('generateExam', { topic, questionCount, difficulty }));
};

export const generateStudyPlan = (
    subjects: string[], 
    days: string[], 
    hours: string, 
    goal: string
): Promise<AsyncGenerator<{ text: string }>> => {
    if (IS_DEV && ai) {
        return Promise.resolve(handleDirectStudyPlan(ai, { subjects, days, hours, goal }));
    }
    return Promise.resolve(streamProxyRequest('generateStudyPlan', { subjects, days, hours, goal }));
};