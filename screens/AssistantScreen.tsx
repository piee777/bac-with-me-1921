import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getTutorResponse } from '../services/geminiService';
import MicrophoneIcon from '../components/icons/MicrophoneIcon';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const AssistantScreen: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', parts: [{ text: 'مرحباً! أنا مساعدك الدراسي. كيف يمكنني مساعدتك اليوم؟' }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<'ar' | 'fr' | 'en'>('ar');
    const [image, setImage] = useState<{b64: string, mimeType: string, preview: string} | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if ((input.trim() === '' && !image) || isLoading) return;

        const userParts: ChatMessage['parts'] = [];
        if(image) {
            userParts.push({ inlineData: { mimeType: image.mimeType, data: image.b64 }});
        }
        if(input.trim() !== '') {
            userParts.push({ text: input });
        }

        const userMessage: ChatMessage = { role: 'user', parts: userParts };
        const historyForApi = messages.filter(m => !m.isLoading);

        setMessages(prev => [...prev, userMessage, { role: 'model', parts: [{text: ''}], isLoading: true }]);
        const currentInput = input;
        const currentImage = image;
        setInput('');
        setImage(null);
        setIsLoading(true);
        setError(null);
        
        try {
            const stream = await getTutorResponse(currentInput, language, historyForApi, currentImage ?? undefined);
            
            setMessages(prev => [
                ...prev.filter(m => !m.isLoading),
                { role: 'model', parts: [{ text: '' }] }
            ]);

            let fullText = "";
            const streamReaderPromise = (async () => {
                for await (const chunk of stream) {
                    fullText += chunk.text;
                }
            })();

            const renderInterval = setInterval(() => {
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    const firstPart = lastMessage?.parts[0];
                    if (lastMessage && lastMessage.role === 'model' && firstPart && 'text' in firstPart && firstPart.text !== fullText) {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: fullText }] };
                        return newMessages;
                    }
                    return prev;
                });
            }, 60);

            await streamReaderPromise;
            clearInterval(renderInterval);

            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: fullText }] };
                return newMessages;
            });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Error: ${errorMessage}`);
            setMessages(prev => [...prev.filter(m => !m.isLoading), { role: 'model', parts: [{ text: `عذراً، حدث خطأ: ${errorMessage}` }] }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const b64 = await fileToBase64(file);
            setImage({ b64, mimeType: file.type, preview: URL.createObjectURL(file) });
        }
    };

    const QuickActionButton: React.FC<{text: string}> = ({text}) => (
        <button 
            onClick={() => { setInput(text); handleSend(); }} 
            disabled={isLoading}
            className="bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-300 font-semibold py-2 px-4 border border-slate-200 dark:border-slate-700 rounded-full text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
            {text}
        </button>
    );

    return (
        <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950">
             <header className="p-4 text-center border-b border-slate-200 dark:border-slate-800">
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">المساعد الذكي</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">مساعدك الشخصي</p>
             </header>

            <div className="flex-1 overflow-y-auto space-y-6 p-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">🤖</div>}
                        <div className={`max-w-md p-3 md:p-4 rounded-3xl shadow-md ${
                            msg.role === 'user' 
                                ? 'bg-gradient-to-br from-teal-400 to-cyan-500 text-white rounded-br-lg' 
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-lg'
                        }`}>
                           {msg.isLoading ? (
                                <div className="flex items-center space-x-2 space-x-reverse p-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {msg.parts.map((part, i) => {
                                        if ('inlineData' in part) {
                                            const userMsg = msg as ChatMessage & { role: 'user' };
                                            const imagePart = userMsg.parts.find(p => 'inlineData' in p) as { inlineData: { data: string, mimeType: string } } | undefined;
                                            if (imagePart) {
                                                const src = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                                                return <img key={i} src={src} className="rounded-lg max-w-xs" alt="User upload" />;
                                            }
                                        }
                                        if ('text' in part) {
                                            return <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                                        }
                                        return null;
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {messages.length === 1 && (
                    <div className="flex justify-center gap-2 flex-wrap animate-fade-in">
                        <QuickActionButton text="لخص لي درس الدوال" />
                        <QuickActionButton text="اقترح تمارين في الأعداد المركبة" />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {image && (
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-between shadow-md">
                        <img src={image.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                        <button onClick={() => setImage(null)} className="text-red-500 p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-800 rounded-full shadow-lg">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 rounded-full" disabled={isLoading}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" /></svg>
                    </button>
                    <button onClick={() => alert('ميزة الإدخال الصوتي قادمة قريباً!')} className="p-3 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 rounded-full" disabled={isLoading}>
                        <MicrophoneIcon className="w-6 h-6" />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="اسأل عن أي شيء..."
                        className="flex-1 bg-transparent p-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || (input.trim() === '' && !image)}
                        className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white rounded-full p-3 hover:opacity-90 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-slate-600 dark:disabled:to-slate-600 transition-opacity"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform -scale-x-100">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssistantScreen;