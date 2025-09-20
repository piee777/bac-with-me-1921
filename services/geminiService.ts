import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTIONS = {
    ar: "أنت مدرس ذكاء اصطناعي شخصي وخبير في منهج البكالوريا الجزائري. مهمتك هي مساعدة الطالب 'عادل'. تكيّف مع مستواه وقدّم شروحات بسيطة وواضحة. عند شرح التمارين، قدم الإجابة خطوة بخطوة. إذا رفع 'عادل' صورة، قم بتحليلها واشرح التمرين. كن محفزاً ومشجعاً دائماً. إذا لاحظت أنه يخطئ في موضوع معين، اقترح عليه بلطف دروساً أو تمارين إضافية لمراجعتها.",
    fr: "Tu es un tuteur IA personnel, expert du programme du baccalauréat algérien. Ton rôle est d'aider l'étudiant 'Adel'. Adapte-toi à son niveau et fournis des explications simples. Pour les exercices, explique la solution étape par étape. Si 'Adel' envoie une image, analyse-la. Sois motivant. Si tu remarques des erreurs récurrentes, suggère-lui gentiment de revoir certaines leçons.",
    en: "You are a personal AI tutor, an expert in the Algerian baccalaureate curriculum. Your mission is to help the student 'Adel'. Adapt to his level and provide simple explanations. Explain exercises step-by-step. If 'Adel' uploads an image, analyze it. Be motivating. If you notice recurring mistakes on a topic, gently suggest specific lessons or exercises for him to review."
};

const apiKey = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
} else {
     console.error(
        "********************************************************************************\n" +
        "* WARNING: Gemini API key not found!                                           *\n" +
        "*                                                                              *\n" +
        "* Please set API_KEY in your environment.                                      *\n" +
        "* The AI Assistant will not be functional.                                     *\n" +
        "********************************************************************************"
    );
}

const model = "gemini-2.5-flash";

const chatInstances: { [key: string]: Chat } = {};

const getChatInstance = (language: 'ar' | 'fr' | 'en'): Chat => {
    if (!ai) {
        throw new Error("Gemini AI client is not initialized. API_KEY might be missing.");
    }
    if (!chatInstances[language]) {
        chatInstances[language] = ai.chats.create({
            model: model,
            config: {
                systemInstruction: SYSTEM_INSTRUCTIONS[language],
            },
        });
    }
    return chatInstances[language];
};

export const getTutorResponse = async (
    prompt: string, 
    language: 'ar' | 'fr' | 'en',
    image?: { b64: string, mimeType: string }
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    
    if (!ai) {
        async function* mockStream(): AsyncGenerator<GenerateContentResponse> {
            yield { text: "عذراً، خدمة المساعد الذكي غير مفعّلة حالياً. يرجى التأكد من إعداد مفتاح API." } as unknown as GenerateContentResponse;
            return;
        }
        return mockStream();
    }
    
    const chat = getChatInstance(language);
    
    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [];
    
    if (image) {
        parts.push({
            inlineData: {
                mimeType: image.mimeType,
                data: image.b64,
            },
        });
    }

    if (prompt) {
        parts.push({ text: prompt });
    }

    const responseStream = await chat.sendMessageStream({
        message: parts
    });
    
    return responseStream;
};
