import { ChatMessage } from '../types';

// The API Key and Gemini SDK are no longer handled on the client-side.
// All requests are now proxied through a secure Netlify Function.

/**
 * Sends a prompt and conversation history to the secure Netlify function proxy,
 * which then communicates with the Gemini API.
 * 
 * @param prompt The user's new text prompt.
 * @param language The selected language for the AI tutor.
 * @param history The existing conversation history to provide context.
 * @param image Optional image data for analysis.
 * @returns An async generator that yields streamed text chunks from the AI.
 */
export const getTutorResponse = async (
    prompt: string, 
    language: 'ar' | 'fr' | 'en',
    history: ChatMessage[],
    image?: { b64: string, mimeType: string }
): Promise<AsyncGenerator<{ text: string }>> => {

    try {
        const response = await fetch('/.netlify/functions/gemini-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // The history sent is the current state of messages, excluding any temporary loading messages.
            body: JSON.stringify({ 
                prompt, 
                language, 
                image, 
                history: history.filter(m => !m.isLoading)
            }),
        });

        if (!response.ok || !response.body) {
            const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
            // Provide a user-friendly error message.
            throw new Error(errorData.error || "عذراً، خدمة المساعد الذكي غير متاحة حالياً. يرجى المحاولة لاحقاً.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // This generator function reads the stream from the proxy and yields parsed data chunks.
        async function* streamGenerator(): AsyncGenerator<{ text: string }> {
            let buffer = '';
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    if (buffer.length > 0) {
                        // Process any remaining data in the buffer, assuming Server-Sent Events format.
                        const lines = buffer.split('\n\n');
                        for (const line of lines) {
                           if (line.startsWith('data: ')) {
                                const jsonStr = line.substring(6);
                                if (jsonStr) {
                                    try { yield JSON.parse(jsonStr); } catch (e) { console.error("Error parsing final JSON chunk:", e); }
                                }
                            }
                        }
                    }
                    break;
                }
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                
                // Keep the last, possibly incomplete line in the buffer for the next read.
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        if (jsonStr) {
                            try {
                                yield JSON.parse(jsonStr);
                            } catch (e) {
                                console.error("Error parsing JSON chunk from stream:", e);
                            }
                        }
                    }
                }
            }
        }
        
        return streamGenerator();

    } catch (error) {
        console.error("Error calling Gemini proxy:", error);
        // Re-throw the error so it can be caught by the UI component and displayed to the user.
        throw error;
    }
};
