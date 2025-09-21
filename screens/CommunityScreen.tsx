import React, { useState, useEffect, useRef } from 'react';
import { fetchCommunityPosts, addCommunityPost, addCommunityAnswer, fetchSubjects, fetchChatMessages, sendChatMessage, subscribeToChatMessages } from '../services/api';
import { CommunityPost, Subject, RealtimeChatMessage } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

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
                            <h3 className="font-bold text-slate-800 dark:text-white">{post.author}</h3>
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
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{answer.author}</h4>
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
                                    <h3 className="font-bold text-slate-800 dark:text-white">{post.author}</h3>
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUserName = localStorage.getItem('userName');

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

        return () => {
            channel.unsubscribe();
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!content) return;

        setNewMessage('');
        try {
            await sendChatMessage(content);
        } catch (err) {
            alert('فشل إرسال الرسالة.');
            setNewMessage(content); // Restore message on failure
        }
    };
    
    if (loading) return <div className="h-full flex justify-center items-center">جاري تحميل الدردشة...</div>;
    if (error) return <div className="h-full flex justify-center items-center text-red-500">{error}</div>;

    return (
        <div className="h-full flex flex-col">
            <header className="mb-4">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">الدردشة الحية</h1>
                <p className="text-slate-500 dark:text-slate-400">تواصل مع زملائك في الوقت الفعلي.</p>
            </header>
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-inner">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-3 ${msg.userName === currentUserName ? 'justify-end' : 'justify-start'}`}>
                        {msg.userName !== currentUserName && <img src={msg.avatarUrl} alt={msg.userName} className="w-8 h-8 rounded-full" />}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.userName === currentUserName ? 'bg-teal-500 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                            {msg.userName !== currentUserName && <p className="font-bold text-sm text-teal-600 dark:text-teal-400 mb-1">{msg.userName}</p>}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                         {msg.userName === currentUserName && <img src={msg.avatarUrl} alt={msg.userName} className="w-8 h-8 rounded-full" />}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg">
                 <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1 bg-transparent p-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
                 <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-teal-500 text-white rounded-full p-3 hover:bg-teal-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 transition-colors"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform -scale-x-100"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                </button>
            </form>
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
                    الدردشة الحية
                </button>
            </div>
            
            <div className="flex-1">
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