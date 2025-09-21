import React, { useState, useEffect } from 'react';
import { fetchSubjects } from '../services/api';
import { generateStudyPlan } from '../services/geminiService';
import { Screen, Subject } from '../types';

interface StudyPlanScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const StudyPlanScreen: React.FC<StudyPlanScreenProps> = ({ setActiveScreen }) => {
    const [step, setStep] = useState<'config' | 'generating' | 'results'>('config');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Config state
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [studyDays, setStudyDays] = useState<string[]>([]);
    const [studyHours, setStudyHours] = useState('ساعتان');
    const [goal, setGoal] = useState('');

    // Results state
    const [plan, setPlan] = useState('');

    useEffect(() => {
        const loadSubjects = async () => {
            const subs = await fetchSubjects();
            setSubjects(subs);
        };
        loadSubjects();
    }, []);

    const handleSubjectToggle = (subjectName: string) => {
        setSelectedSubjects(prev => 
            prev.includes(subjectName) ? prev.filter(s => s !== subjectName) : [...prev, subjectName]
        );
    };

    const handleDayToggle = (day: string) => {
        setStudyDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleGenerate = async () => {
        if (selectedSubjects.length === 0 || studyDays.length === 0 || !goal) {
            setError('يرجى ملء جميع الحقول المطلوبة.');
            return;
        }
        setError(null);
        setPlan(''); // Clear previous plan
        setStep('results'); // Switch to results view immediately to show streaming

        try {
            const stream = await generateStudyPlan(selectedSubjects, studyDays, studyHours, goal);
            for await (const chunk of stream) {
                setPlan(prev => prev + chunk.text);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`فشل إنشاء الخطة: ${message}`);
            setStep('config'); // Go back to config on error
        }
    };
    
    const renderConfig = () => {
        const daysOfWeek = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const hourOptions = ['ساعة واحدة', 'ساعتان', '3 ساعات', '4 ساعات'];

        return (
            <div className="p-6">
                <header className="flex items-center justify-between mb-6">
                    <button onClick={() => setActiveScreen('home')} className="text-slate-500 dark:text-slate-400 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 -scale-x-100"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
                    </button>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">🗓️ مولد خطة المراجعة</h1>
                    <div className="w-10"></div>
                </header>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
                    <div>
                        <label className="font-bold block mb-2">ما هي المواد التي تريد التركيز عليها؟</label>
                        <div className="flex flex-wrap gap-2">
                            {subjects.map(s => (
                                <button key={s.id} onClick={() => handleSubjectToggle(s.name)} className={`px-4 py-2 rounded-full font-semibold text-sm ${selectedSubjects.includes(s.name) ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="font-bold block mb-2">ما هي أيام المراجعة؟</label>
                        <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map(day => (
                                <button key={day} onClick={() => handleDayToggle(day)} className={`px-4 py-2 rounded-full font-semibold text-sm ${studyDays.includes(day) ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="font-bold block mb-2">كم ساعة يمكنك المراجعة يومياً؟</label>
                         <select value={studyHours} onChange={e => setStudyHours(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="font-bold block mb-2">ما هو هدفك الأساسي؟</label>
                        <input type="text" value={goal} onChange={e => setGoal(e.target.value)} placeholder="مثال: التحضير لامتحان الفيزياء" className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg" />
                    </div>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                <button onClick={handleGenerate} className="w-full mt-8 bg-blue-600 text-white font-bold p-4 rounded-xl shadow-lg hover:bg-blue-700">
                    أنشئ خطتي
                </button>
            </div>
        );
    };

    const renderGenerating = () => (
         <div className="h-screen flex flex-col items-center justify-center text-center p-6">
            <svg className="animate-spin h-12 w-12 text-teal-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h1 className="text-2xl font-bold">نحن نخطط لنجاحك...</h1>
            <p className="text-slate-500">يقوم الذكاء الاصطناعي بإعداد خطة مراجعة مخصصة لك.</p>
        </div>
    );

    const renderResults = () => (
        <div className="p-6">
            <header className="text-center mb-6">
                 <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">🗓️ خطة المراجعة المخصصة</h1>
            </header>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg prose prose-lg dark:prose-invert max-w-full min-h-[200px]">
                {plan ? (
                    plan.split('\n').map((line, index) => {
                        if (line.startsWith('## ')) {
                            return <h2 key={index} className="font-bold text-xl mt-4 mb-2">{line.substring(3)}</h2>
                        }
                         if (line.startsWith('* ')) {
                            return <li key={index} className="ml-6">{line.substring(2)}</li>
                        }
                        return <p key={index}>{line}</p>;
                    })
                ) : (
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                         <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
                         <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                         <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse delay-300"></div>
                    </div>
                )}
            </div>
             <button onClick={() => setStep('config')} className="w-full mt-8 bg-slate-800 dark:bg-slate-700 text-white font-bold p-4 rounded-xl shadow hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">
                إنشاء خطة جديدة
            </button>
        </div>
    );

    switch (step) {
        case 'generating': return renderGenerating(); // This step is now very brief.
        case 'results': return renderResults();
        case 'config':
        default:
            return renderConfig();
    }
};

export default StudyPlanScreen;
