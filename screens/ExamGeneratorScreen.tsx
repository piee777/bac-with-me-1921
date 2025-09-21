import React, { useState } from 'react';
import { generateExam } from '../services/geminiService';
import { Screen, Exercise, QuizOption } from '../types';

interface ExamGeneratorScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const quickTrivia = [
    {
        question: "ما هو أسرع حيوان بري في العالم؟",
        options: ["الفهد", "الأسد", "الغزال"],
    },
    {
        question: "كم عدد الكواكب في نظامنا الشمسي؟",
        options: ["8", "9", "7"],
    },
    {
        question: "ما هي عاصمة أستراليا؟",
        options: ["سيدني", "ملبورن", "كانبرا"],
    },
    {
        question: "من هو مخترع المصباح الكهربائي؟",
        options: ["نيكولا تيسلا", "توماس إديسون", "ألكسندر غراهام بيل"],
    }
];


const ExamGeneratorScreen: React.FC<ExamGeneratorScreenProps> = ({ setActiveScreen }) => {
    const [step, setStep] = useState<'config' | 'generating' | 'display'>('config');
    
    // Config state
    const [topic, setTopic] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    // Exam state
    const [exam, setExam] = useState<Exercise[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [trivia, setTrivia] = useState<{ question: string; options: string[]; } | null>(null);
    const [userSelections, setUserSelections] = useState<Record<string, string>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);


    const handleGenerateExam = async () => {
        if (!topic.trim()) {
            setError('يرجى إدخال موضوع أولاً.');
            return;
        }
        setTrivia(quickTrivia[Math.floor(Math.random() * quickTrivia.length)]);
        setStep('generating');
        setError(null);
        
        try {
            const stream = await generateExam(topic, questionCount, difficulty);
            let jsonString = '';
            for await (const chunk of stream) {
                jsonString += chunk.text;
            }
            
            const cleanedJson = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
            const result = JSON.parse(cleanedJson);

            if (result && result.exam) {
                 const formattedExam: Exercise[] = result.exam.map((q: any, index: number): Exercise => ({
                    id: `gen-${index}`,
                    question: q.question || 'Missing question',
                    subject: q.subject || 'General',
                    type: 'mcq',
                    options: q.options || [],
                }));
                setExam(formattedExam);
                setStep('display');
            } else {
                throw new Error("Invalid response structure from AI.");
            }

        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`فشل إنشاء الأسئلة. حاول مرة أخرى أو بسّط الموضوع. (${message})`);
            setStep('config');
        }
    };
    
    const restart = () => {
        setStep('config');
        setExam([]);
        setError(null);
        setTopic('');
        setUserSelections({});
        setIsFinished(false);
        setScore(0);
    };

    const retryExam = () => {
        setUserSelections({});
        setIsFinished(false);
        setScore(0);
    };

    const handleSelectAnswer = (questionId: string, optionText: string) => {
        setUserSelections(prev => ({ ...prev, [questionId]: optionText }));
    };

    const handleFinishExam = () => {
        let correctCount = 0;
        exam.forEach(q => {
            const correctAnswerText = q.options.find(opt => opt.is_correct)?.text;
            if(userSelections[q.id] === correctAnswerText) {
                correctCount++;
            }
        });
        setScore(correctCount);
        setIsFinished(true);
    };

    const renderConfig = () => (
        <div className="p-6">
            <header className="flex items-center justify-between mb-6">
                 <button onClick={() => setActiveScreen('home')} className="text-slate-500 dark:text-slate-400 p-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 -scale-x-100"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
                </button>
                 <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">🤖 مولّد الأسئلة</h1>
                 <div className="w-10"></div>
            </header>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
                <div>
                    <label className="font-bold block mb-2">اكتب الموضوع الذي تريد إنشاء أسئلة عنه</label>
                    <textarea
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="مثال: الأعداد المركبة، أو مرحلة الترجمة في تركيب البروتين..."
                        rows={4}
                        className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                </div>
                <div>
                    <label className="font-bold block mb-2">عدد الأسئلة: {questionCount}</label>
                    <input type="range" min="3" max="15" value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700" />
                </div>
                <div>
                    <label className="font-bold block mb-2">مستوى الصعوبة</label>
                    <div className="flex gap-2">
                        {(['easy', 'medium', 'hard'] as const).map(level => (
                            <button key={level} onClick={() => setDifficulty(level)} className={`flex-1 p-3 rounded-lg font-semibold ${difficulty === level ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                {level === 'easy' ? 'سهل' : level === 'medium' ? 'متوسط' : 'صعب'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            <button onClick={handleGenerateExam} className="w-full mt-8 bg-blue-600 text-white font-bold p-4 rounded-xl shadow-lg hover:bg-blue-700">
                أنشئ الأسئلة
            </button>
        </div>
    );
    
    const renderGenerating = () => (
        <div className="h-screen flex flex-col items-center justify-center text-center p-6">
            <svg className="animate-spin h-12 w-12 text-teal-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h1 className="text-2xl font-bold">يقوم الذكاء الاصطناعي بإعداد أسئلتك...</h1>
            <p className="text-slate-500 dark:text-slate-400">قد يستغرق الأمر بضع لحظات.</p>

            {trivia && (
                <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg max-w-sm w-full animate-fade-in">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">سؤال سريع ريثما ننتهي...</h3>
                    <p className="font-semibold text-slate-800 dark:text-white mb-4">{trivia.question}</p>
                    <div className="space-y-2">
                        {trivia.options.map(opt => (
                            <div key={opt} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                                {opt}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderDisplay = () => {
        const allAnswered = Object.keys(userSelections).length === exam.length;

        return (
            <div className="p-6">
                <header className="flex items-center justify-between mb-6">
                     <button onClick={() => setActiveScreen('home')} className="text-slate-500 dark:text-slate-400 p-2">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 -scale-x-100"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
                    </button>
                     <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                        {isFinished ? 'النتيجة والمراجعة' : 'أجب على الأسئلة'}
                     </h1>
                     <div className="w-10"></div>
                </header>
                
                {isFinished && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg w-full text-center mb-6 animate-fade-in">
                        <p className="text-xl font-bold">نتيجتك النهائية</p>
                        <p className="text-6xl font-extrabold text-teal-500 my-4">
                            {score} <span className="text-4xl text-slate-500 dark:text-slate-400">/ {exam.length}</span>
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                            {score / exam.length >= 0.8 ? "ممتاز! عمل رائع." : score / exam.length >= 0.5 ? "جيد جداً، استمر في المراجعة." : "تحتاج إلى المزيد من المراجعة في هذا الموضوع."}
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {exam.map((question, index) => {
                        const questionId = question.id || `gen-${index}`;
                        const selectedOptionText = userSelections[questionId];
                        const correctAnswerText = question.options.find(opt => opt.is_correct)?.text;
                        
                        return (
                            <div key={questionId} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow">
                                <p className="font-bold mb-3 text-slate-800 dark:text-white">{index + 1}. {question.question}</p>
                                <div className="space-y-2">
                                    {question.options.map(option => {
                                        let buttonClass = '';

                                        if (!isFinished) {
                                            if (selectedOptionText === option.text) {
                                                buttonClass = 'bg-teal-500 text-white border-teal-500';
                                            } else {
                                                buttonClass = 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500';
                                            }
                                        } else {
                                            if (option.is_correct) {
                                                buttonClass = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
                                            } else if (option.text === selectedOptionText) {
                                                buttonClass = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
                                            } else {
                                                buttonClass = 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 opacity-60';
                                            }
                                        }
                                        
                                        return (
                                            <button
                                                key={option.text}
                                                onClick={() => handleSelectAnswer(questionId, option.text)}
                                                disabled={isFinished}
                                                className={`w-full text-right p-3 rounded-lg border font-medium transition-colors ${buttonClass}`}
                                            >
                                                {option.text}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!isFinished ? (
                     <button 
                        onClick={handleFinishExam} 
                        disabled={!allAnswered}
                        className="w-full mt-8 bg-green-600 text-white font-bold p-4 rounded-xl shadow-lg hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all">
                        {allAnswered ? 'عرض النتيجة' : 'أجب على جميع الأسئلة أولاً'}
                    </button>
                ) : (
                    <div className="w-full mt-8 flex flex-col sm:flex-row gap-4">
                        <button onClick={retryExam} className="flex-1 bg-slate-800 dark:bg-slate-700 text-white font-bold p-4 rounded-xl shadow hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">
                            إعادة المحاولة
                        </button>
                         <button onClick={restart} className="flex-1 bg-blue-600 text-white font-bold p-4 rounded-xl shadow hover:bg-blue-700 transition-colors">
                            إنشاء اختبار جديد
                        </button>
                    </div>
                )}
            </div>
        );
    }
    
    switch (step) {
        case 'generating': return renderGenerating();
        case 'display': return renderDisplay();
        case 'config':
        default:
            return renderConfig();
    }
};

export default ExamGeneratorScreen;