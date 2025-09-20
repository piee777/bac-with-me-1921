import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const AuthScreen: React.FC = () => {
    const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (mode === 'signUp') {
            if (password !== confirmPassword) {
                setError('كلمتا المرور غير متطابقتين.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name: fullName },
                    // FIX: This line programmatically provides the correct redirect URL,
                    // fixing the issue where confirmation emails would link to localhost.
                    emailRedirectTo: window.location.origin,
                },
            });

            if (error) {
                setError(error.message);
            } else if (data.user && !data.session) {
                setMessage('تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
            }
        } else { // signIn
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes("Invalid login credentials")) {
                    setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
                } else if (error.message.includes("Email not confirmed")) {
                     setError('لم يتم تفعيل حسابك بعد. يرجى التحقق من بريدك الإلكتروني والنقر على رابط التفعيل.');
                } else {
                    setError(error.message);
                }
            }
        }
        setLoading(false);
    };
    
    const renderInputField = (id: string, type: string, placeholder: string, value: string, onChange: (val: string) => void, icon: JSX.Element) => (
         <div>
            <label htmlFor={id} className="sr-only">{placeholder}</label>
             <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                   {icon}
                </span>
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    className="w-full p-4 pr-12 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                 <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">
                        مرحباً بك مجدداً
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        {mode === 'signIn' ? 'سجل دخولك للمتابعة' : 'أنشئ حساباً جديداً للبدء'}
                    </p>
                </div>
                
                 <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-8">
                    <div className="flex justify-center border-b-2 border-slate-200 dark:border-slate-700 mb-6">
                        <button onClick={() => setMode('signIn')} className={`w-1/2 pb-3 font-bold transition-colors ${mode === 'signIn' ? 'text-teal-500 border-b-2 border-teal-500' : 'text-slate-500'}`}>
                            تسجيل الدخول
                        </button>
                        <button onClick={() => setMode('signUp')} className={`w-1/2 pb-3 font-bold transition-colors ${mode === 'signUp' ? 'text-teal-500 border-b-2 border-teal-500' : 'text-slate-500'}`}>
                            إنشاء حساب
                        </button>
                    </div>

                    <form onSubmit={handleAuthAction} className="space-y-4">
                        {mode === 'signUp' && renderInputField('fullName', 'text', 'الاسم الكامل', fullName, setFullName, 
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        )}
                        
                        {renderInputField('email', 'email', 'البريد الإلكتروني', email, setEmail,
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        )}

                        {renderInputField('password', 'password', 'كلمة المرور', password, setPassword,
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        )}

                        {mode === 'signUp' && renderInputField('confirmPassword', 'password', 'تأكيد كلمة المرور', confirmPassword, setConfirmPassword,
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        )}

                        <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors disabled:bg-teal-300 flex items-center justify-center mt-4">
                            {loading ? <LoadingSpinner /> : (mode === 'signIn' ? 'تسجيل الدخول' : 'إنشاء حساب')}
                        </button>
                    </form>

                    {error && <p className="mt-4 text-center text-red-500 text-sm font-semibold">{error}</p>}
                    {message && <p className="mt-4 text-center text-green-500 text-sm font-semibold">{message}</p>}
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;