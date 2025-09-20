import React, { useState, useEffect } from 'react';
import { Screen, PastExam, Subject } from '../types';
import { fetchPastExams, fetchSubjects } from '../services/api';

interface PastExamsScreenProps {
  setActiveScreen: (screen: Screen) => void;
}

const PastExamsScreen: React.FC<PastExamsScreenProps> = ({ setActiveScreen }) => {
    const [exams, setExams] = useState<PastExam[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [examsData, subjectsData] = await Promise.all([
                    fetchPastExams(),
                    fetchSubjects()
                ]);
                setExams(examsData);
                setSubjects(subjectsData);
                setError(null);
            } catch (err) {
                setError("Failed to load past exams data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredExams = exams.filter(exam => {
        const subjectMatch = subjectFilter === 'all' || exam.subjectId === subjectFilter;
        const yearMatch = yearFilter === 'all' || exam.year.toString() === yearFilter;
        return subjectMatch && yearMatch;
    });
    
    const availableYears = [...new Set(exams.map(e => e.year))].sort((a,b) => b - a);

    return (
        <div className="p-6">
            <header className="flex items-center justify-between mb-6">
                <button onClick={() => setActiveScreen('home')} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 -scale-x-100"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
                </button>
                 <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">📚 مكتبة الامتحانات</h1>
                 <div className="w-10"></div>
            </header>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="all">كل المواد</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="all">كل السنوات</option>
                     {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {loading && <div className="text-center">Loading Exams...</div>}
            {error && <div className="text-center text-red-500">{error}</div>}
            {!loading && !error && (
                <div className="space-y-4">
                    {filteredExams.length > 0 ? filteredExams.map(exam => (
                        <div key={exam.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">بكالوريا {exam.year}</h3>
                                    <p className="text-slate-500 dark:text-slate-400">{exam.subjectName}</p>
                                </div>
                                <div className="flex gap-3 mt-4 sm:mt-0">
                                    <a href={exam.topicUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-700 font-bold py-2 px-4 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70">
                                        الموضوع
                                    </a>
                                     <a href={exam.solutionUrl} target="_blank" rel="noopener noreferrer" className="bg-green-100 text-green-700 font-bold py-2 px-4 rounded-lg hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70">
                                        الحل
                                    </a>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                            لا توجد امتحانات تطابق معايير البحث.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default PastExamsScreen;