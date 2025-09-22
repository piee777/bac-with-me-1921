import React, { useState, useEffect, useRef } from 'react';
import { fetchCommunityPosts, addCommunityPost, addCommunityAnswer, fetchSubjects, fetchChatMessages, sendChatMessage, subscribeToChatMessages } from '../services/api';
import { CommunityPost, Subject, RealtimeChatMessage } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

// Helper function to resize and compress the image
const processImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
                reject(new Error('Canvas to Blob conversion failed'));
            }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


const PostDetailView: React.FC<{
    post: CommunityPost;
    onBack: () => void;
    onAddAnswer: (answerText: string) => void;
}> = ({ post, onBack, onAddAnswer }) => {
    const [newAnswerText, setNewAnswerText] = useState('');

    const handleSubmit = () => {
        if (newAnswerText.trim()) {
            onAddAnswer(newAnswerText);
            setNewAnswerText('');
        }
    };

    return (
        <div className="p-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mb-6 font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 -scale-x-100">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
                <span>العودة للمجتمع</span>
            </button>

            {/* Original Post */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg mb-6">
                <div className="flex items-start gap-4">
                    <img src={post.avatarUrl} alt={post.author} className="w-12 h-12 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 dark:text-white">{post.author}</h3>
                                {post.author === 'bensadel' && <span className="text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-full shadow-sm">المطور</span>}
                            </div>
                            <span className="text-xs text-slate-400">{post.timestamp}</span>
                        </div>
                        <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full inline-block mt-1">{post.subject}</span>
                        <p className="mt-2 text-lg text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.question}</p>
                    </div>
                </div>
            </div>

            {/* Answers section */}
            <h2 className="text-xl font-bold mb-4">{post.answers.length} إجابات</h2>
            <div className="space-y-4">
                {post.answers.map(answer => (
                    <div key={answer.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
                        <div className="flex items-start gap-3">
                            <img src={answer.avatarUrl} alt={answer.author} className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{answer.author}</h4>
                                        {answer.author === 'bensadel' && <span className="text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-full shadow-sm">المطور</span>}
                                    </div>
                                    <span className="text-xs text-slate-400">{answer.timestamp}</span>
                                </div>
                                <p className="mt-1 text-slate-600 dark:text-slate-300">{answer.text}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {post.answers.length === 0 && (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                        لا توجد إجابات بعد. كن أول من يجيب!
                    </p>
                )}
            </div>

            {/* Add answer form */}
            <div className="mt-8">
                <h3 className="text-lg font-bold mb-2">أضف إجابتك</h3>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg flex flex-col gap-2">
                    <textarea
                        value={newAnswerText}
                        onChange={(e) => setNewAnswerText(e.target.value)}
                        placeholder="اكتب إجابتك هنا..."
                        rows={4}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button 
                        onClick={handleSubmit}
                        disabled={!newAnswerText.trim()}
                        className="self-end bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 transition-colors"
                    >
                        إرسال الإجابة
                    </button>
                </div>
            </div>
        </div>
    );
};

const PostQuestionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    question: string;
    onQuestionChange: (value: string) => void;
    subjects: Subject[];
    selectedSubjectId: string;
    onSubjectChange: (value: string) => void;
    onSubmit: () => void;
}> = ({ isOpen, onClose, question, onQuestionChange, subjects, selectedSubjectId, onSubjectChange, onSubmit }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300" style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 transition-transform duration-300" style={{ transform: isOpen ? 'translateY(0)' : 'translateY(20px)', opacity: isOpen ? 1 : 0 }}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">اطرح سؤالاً جديداً</h2>
                <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="space-y-4">
                <textarea
                    value={question}
                    onChange={(e) => onQuestionChange(e.target.value)}
                    placeholder="اكتب سؤالك هنا بوضوح..."
                    rows={6}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                />
                <select
                    value={selectedSubjectId}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                >
                    {subjects.filter(s => s.lessons.length > 0).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                    إلغاء
                </button>
                <button onClick={onSubmit} className="bg-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-teal-300 dark:disabled:bg-teal-800/50 disabled:cursor-not-allowed" disabled={!question.trim()}>
                    نشر السؤال
                </button>
            </div>
        </div>
    </div>
);

const ForumView: React.FC<{
    posts: CommunityPost[],
    subjects: Subject[],
    onSelectPost: (post: CommunityPost) => void,
    onAddPost: (question: string, subjectName: string) => Promise<CommunityPost | void>,
}> = ({ posts, subjects, onSelectPost, onAddPost }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState(subjects.find(s => s.lessons.length > 0)?.id || subjects[0]?.id || '');

    const handlePost = async () => {
        if (!newQuestion.trim()) return;
        const subjectName = subjects.find(s => s.id === selectedSubjectId)?.name || 'مادة عامة';
        try {
            await onAddPost(newQuestion, subjectName);
            setIsModalOpen(false);
            setNewQuestion('');
            setSelectedSubjectId(subjects.find(s => s.lessons.length > 0)?.id || subjects[0]?.id || '');
        } catch (err) {
            const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع.";
            alert(message);
        }
    };

    return (
        <>
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">مجتمع الطلاب</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-teal-500 text-white font-bold py-2 px-4 rounded-full text-sm hover:bg-teal-600 transition-colors flex items-center gap-2 transform hover:scale-105"
                    aria-haspopup="dialog"
                    aria-expanded={isModalOpen}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                    اطرح سؤالاً
                </button>
            </header>
            <div className="space-y-4">
                {posts.length > 0 ? posts.map(post => (
                    <div key={post.id} onClick={() => onSelectPost(post)} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-start gap-4">
                            <img src={post.avatarUrl} alt={post.author} className="w-12 h-12 rounded-full flex-shrink-0" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 dark:text-white">{post.author}</h3>
                                        {post.author === 'bensadel' && <span className="text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded-full shadow-sm">المطور</span>}
                                    </div>
                                    <span className="text-xs text-slate-400">{post.timestamp}</span>
                                </div>
                                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full inline-block mt-1">{post.subject}</span>
                                <p className="mt-2 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{post.question}</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                                {post.answers.length} إجابات
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12">
                        <p className="text-slate-500 dark:text-slate-400">لا توجد أسئلة بعد. كن أول من يطرح سؤالاً!</p>
                    </div>
                )}
            </div>
            <PostQuestionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                question={newQuestion}
                onQuestionChange={setNewQuestion}
                subjects={subjects}
                selectedSubjectId={selectedSubjectId}
                onSubjectChange={setSelectedSubjectId}
                onSubmit={handlePost}
            />
        </>
    );
};

const LiveChatView: React.FC = () => {
    const [messages, setMessages] = useState<RealtimeChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<{ userName: string; avatarUrl: string }[]>([]);
    const [showNewMessagesIndicator, setShowNewMessagesIndicator] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // FIX: Replaced `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` for browser compatibility.
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentUserName = localStorage.getItem('userName');
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                setLoading(true);
                const initialMessages = await fetchChatMessages();
                setMessages(initialMessages);
            } catch (err) {
                setError('فشل تحميل الرسائل.');
            } finally {
                setLoading(false);
            }
        };
        loadMessages();

        const channel = subscribeToChatMessages((newMessage) => {
            setMessages(prevMessages => {
                if (prevMessages.some(msg => msg.id === newMessage.id)) {
                    return prevMessages;
                }
                return [...prevMessages, newMessage];
            });
        });
        channelRef.current = channel;

        channel.on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            const currentOnline = new Set<string>();
            const currentTyping: { userName: string; avatarUrl: string }[] = [];
            
            for (const key in presenceState) {
                const presences = presenceState[key] as any[];
                const user = presences[0];
                if (user?.user_name) {
                    currentOnline.add(user.user_name);
                    if (user.is_typing && user.user_name !== currentUserName) {
                        currentTyping.push({ userName: user.user_name, avatarUrl: user.avatar_url });
                    }
                }
            }
            setOnlineUsers(currentOnline);
            setTypingUsers(currentTyping);
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ 
                    user_name: currentUserName, 
                    avatar_url: localStorage.getItem('userAvatarUrl'),
                    is_typing: false 
                });
            }
        });

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [currentUserName]);

    useEffect(() => {
        if (!chatContainerRef.current) return;
        
        const isNearBottom = chatContainerRef.current.scrollTop < 150;
        const latestMessage = messages[messages.length - 1];
        
        if (isNearBottom || (latestMessage && latestMessage.userName === currentUserName)) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setShowNewMessagesIndicator(false);
        } else if (messages.length > 0) {
            setShowNewMessagesIndicator(true);
        }
    }, [messages, currentUserName]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content && !imageFile) return;

        const currentImageFile = imageFile;
        setNewMessage('');
        setImageFile(null);
        setImagePreview(null);

        try {
            await sendChatMessage(content, currentImageFile);
        } catch (err) {
            alert('فشل إرسال الرسالة.');
            setNewMessage(content);
            setImageFile(currentImageFile);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (channelRef.current) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            channelRef.current.track({ is_typing: true });
            typingTimeoutRef.current = setTimeout(() => {
                channelRef.current?.track({ is_typing: false });
            }, 2000);
        }
    };
    
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedFile = await processImage(file);
                setImageFile(compressedFile);
                setImagePreview(URL.createObjectURL(compressedFile));
            } catch (err) {
                alert('فشل معالجة الصورة.');
            }
        }
    };
    
    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop } = chatContainerRef.current;
            if (scrollTop > 150 && showNewMessagesIndicator) {
                 // User scrolled up, so we do nothing to the indicator
            } else if (scrollTop < 150 && showNewMessagesIndicator) {
                // User scrolled back down, hide the indicator
                setShowNewMessagesIndicator(false);
            }
        }
    };
    
    if (loading) return <div className="h-full flex justify-center items-center">جاري تحميل الدردشة...</div>;
    if (error) return <div className="h-full flex justify-center items-center text-red-500">{error}</div>;

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            <header className="p-4 border-b border-slate-200 dark:border-slate-800 text-center flex-shrink-0">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">الشات</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{onlineUsers.size} أعضاء متصلون</p>
            </header>

            <div className="flex-1 relative overflow-hidden">
                <div 
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="absolute inset-0 p-4 flex flex-col-reverse gap-0.5 overflow-y-auto"
                >
                    <div ref={messagesEndRef} className="h-0.5" />
                    
                    {typingUsers.length > 0 && (
                        <div className="flex items-end gap-2.5 mb-2 animate-fade-in self-start">
                             <img src={typingUsers[0].avatarUrl} alt={typingUsers[0].userName} className="w-7 h-7 rounded-full" />
                            <div className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-700">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse delay-300"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {[...messages].reverse().map((msg, index) => {
                        const reversedMessages = [...messages].reverse();
                        const prevTemporalMsg = reversedMessages[index - 1]; 
                        const nextTemporalMsg = reversedMessages[index + 1]; 
                        
                        const isCurrentUserMsg = msg.userName === currentUserName;
                        const isFirstOfUserBlock = !prevTemporalMsg || prevTemporalMsg.userName !== msg.userName;
                        
                        return (
                            <div key={msg.id} className={`flex w-full items-end gap-2.5 animate-slide-up-fade-in ${isFirstOfUserBlock ? 'mt-4' : 'mt-1'} ${isCurrentUserMsg ? 'justify-end' : 'justify-start'}`}>
                                 {!isCurrentUserMsg && (
                                    <div className="w-7 h-7 flex-shrink-0 self-end">
                                        {isFirstOfUserBlock && <img src={msg.avatarUrl} alt={msg.userName} className="w-full h-full rounded-full" />}
                                    </div>
                                )}
                                <div className={`max-w-[70%] md:max-w-[60%] w-fit`}>
                                     {isFirstOfUserBlock && !isCurrentUserMsg && (
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <p className="font-bold text-sm text-slate-600 dark:text-slate-300">{msg.userName}</p>
                                            {msg.userName === 'bensadel' && <span className="text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 rounded-full shadow-sm">المطور</span>}
                                        </div>
                                     )}
                                    {msg.imageUrl ? (
                                        <img src={msg.imageUrl} alt="Chat attachment" className={`rounded-2xl w-full h-auto object-cover`} />
                                    ) : (
                                        <div className={`px-4 py-2.5 whitespace-pre-wrap break-words rounded-2xl ${isCurrentUserMsg ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50'}`}>
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                 {showNewMessagesIndicator && (
                    <button
                        onClick={() => {
                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="absolute bottom-4 right-1/2 translate-x-1/2 bg-blue-500/90 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg animate-fade-in"
                    >
                        👇 رسائل جديدة
                    </button>
                )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
                 {imagePreview && (
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-between mb-2 animate-fade-in">
                        <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                        <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-red-500 p-2">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 p-1.5 bg-slate-200 dark:bg-slate-800 rounded-3xl">
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M15.5 5.75a.75.75 0 00-1.5 0v3h-3a.75.75 0 000 1.5h3v3a.75.75 0 001.5 0v-3h3a.75.75 0 000-1.5h-3v-3z" /><path fillRule="evenodd" d="M2 5a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V5zm3-1.5A1.5 1.5 0 003.5 5v10A1.5 1.5 0 005 16.5h10A1.5 1.5 0 0016.5 15V5A1.5 1.5 0 0015 3.5H5z" clipRule="evenodd" /></svg>
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="رسالة..."
                        className="flex-1 bg-transparent px-2 text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim() && !imageFile}
                        className={`font-semibold text-blue-500 px-3 transition-all duration-200 ${(!newMessage.trim() && !imageFile) ? 'w-0 opacity-0 -mr-2' : 'w-auto opacity-100 mr-0'}`}
                    >
                        إرسال
                    </button>
                </form>
            </div>
        </div>
    );
};


const CommunityScreen: React.FC = () => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
    const [view, setView] = useState<'forum' | 'chat'>('forum');

    useEffect(() => {
        if (view === 'forum') {
            const loadData = async () => {
                try {
                    setLoading(true);
                    const [postsData, subjectsData] = await Promise.all([
                        fetchCommunityPosts(),
                        fetchSubjects(),
                    ]);
                    setPosts(postsData);
                    setSubjects(subjectsData);
                    setError(null);
                } catch (err) {
                    setError("Failed to load community data.");
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [view]);

    const handleAddPost = async (question: string, subjectName: string): Promise<CommunityPost | void> => {
        const newPost = await addCommunityPost(question, subjectName);
        setPosts(prevPosts => [newPost, ...prevPosts]);
        return newPost;
    };

    const handleAddAnswer = async (answerText: string) => {
        if (!selectedPost) return;

        try {
            const newAnswer = await addCommunityAnswer(selectedPost.id, answerText);
            
            const updatedPosts = posts.map(p => {
                if (p.id === selectedPost.id) {
                    return { ...p, answers: [...p.answers, newAnswer] };
                }
                return p;
            });
            setPosts(updatedPosts);
            setSelectedPost(prev => prev ? { ...prev, answers: [...prev.answers, newAnswer] } : null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع.";
            alert(message);
        }
    };

    if (selectedPost) {
        return <PostDetailView post={selectedPost} onBack={() => setSelectedPost(null)} onAddAnswer={handleAddAnswer} />;
    }

    return (
        <div className="p-6 h-screen flex flex-col">
            <div className="flex justify-center mb-6 bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full">
                <button 
                    onClick={() => setView('forum')} 
                    className={`px-6 py-2 rounded-full font-bold w-1/2 ${view === 'forum' ? 'bg-white dark:bg-slate-700 shadow text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}
                >
                    المنتدى
                </button>
                <button 
                    onClick={() => setView('chat')} 
                    className={`px-6 py-2 rounded-full font-bold w-1/2 ${view === 'chat' ? 'bg-white dark:bg-slate-700 shadow text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}
                >
                    الشات
                </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
                {view === 'forum' ? (
                    loading ? <div className="h-full flex justify-center items-center">جاري تحميل المنتدى...</div> :
                    error ? <div className="h-full flex justify-center items-center text-red-500">{error}</div> :
                    <ForumView posts={posts} subjects={subjects} onSelectPost={setSelectedPost} onAddPost={handleAddPost} />
                ) : (
                    <LiveChatView />
                )}
            </div>
        </div>
    );
};

export default CommunityScreen;
