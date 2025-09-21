import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const InputField: React.FC<{
    id: string;
    type: 'text' | 'email' | 'password';
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    icon: JSX.Element;
    isPassword?: boolean;
}> = ({ id, type, placeholder, value, onChange, icon, isPassword = false }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const inputType = isPassword ? (isPasswordVisible ? 'text' : 'password') : type;

    return (
        <div>
            <label htmlFor={id} className="sr-only">{placeholder}</label>
            <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                    {icon}
                </span>
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
                        aria-label={isPasswordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                        {isPasswordVisible ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        )}
                    </button>
                )}
                <input
                    id={id}
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required
                    className="w-full p-4 pr-12 text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
                />
            </div>
        </div>
    );
};

// Function to translate common Supabase auth errors to Arabic
const translateSupabaseError = (message: string): string => {
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes('invalid login credentials')) {
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات أو استخدام خيار "نسيت كلمة المرور".';
    }
    if (lowerCaseMessage.includes('email not confirmed')) {
        return 'لم يتم تفعيل حسابك بعد. يرجى التحقق من بريدك الإلكتروني والنقر على رابط التفعيل.';
    }
    if (lowerCaseMessage.includes('user already registered')) {
        return 'هذا البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول أو استخدم بريداً آخر.';
    }
    if (lowerCaseMessage.includes('password should be at least')) {
        return 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.';
    }
    if (lowerCaseMessage.includes('unable to validate email address: invalid format')) {
        return 'صيغة البريد الإلكتروني الذي أدخلته غير صحيحة.';
    }
    return message; // Fallback for untranslated errors
};


const AuthScreen: React.FC = () => {
    const [mode, setMode] = useState<'signIn' | 'signUp' | 'resetPassword'>('signIn');
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

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (mode === 'signUp') {
            if (trimmedPassword !== confirmPassword.trim()) {
                setError('كلمتا المرور غير متطابقتين.');
                setLoading(false);
                return;
            }

            // If email confirmation is disabled in Supabase, this call
            // will sign up the user and log them in simultaneously.
            // The onAuthStateChange listener in App.tsx handles the session update.
            const { error } = await supabase.auth.signUp({
                email: trimmedEmail,
                password: trimmedPassword,
                options: {
                    data: { name: fullName.trim() },
                },
            });

            if (error) {
                setError(translateSupabaseError(error.message));
            }
            // No success message needed; the app will navigate on state change.
            
        } else { // signIn
            const { error } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password: trimmedPassword,
            });

            if (error) {
                setError(translateSupabaseError(error.message));
            }
        }
        setLoading(false);
    };
    
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin,
        });

        if (error) {
            setError('حدث خطأ أثناء محاولة إرسال رابط إعادة التعيين.');
            console.error(error);
        } else {
            setMessage('تم إرسال الرابط. يرجى التحقق من بريدك الإلكتروني (بما في ذلك مجلد الرسائل غير المرغوب فيها).');
        }
        setLoading(false);
    };

    const emailIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    const passwordIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
    const userIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                 <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">
                        {mode === 'resetPassword' ? 'إعادة تعيين كلمة المرور' : 'مرحباً بك مجدداً'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        {mode === 'signIn' && 'سجل دخولك للمتابعة'}
                        {mode === 'signUp' && 'أنشئ حساباً جديداً للبدء'}
                        {mode === 'resetPassword' && 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين.'}
                    </p>
                </div>
                
                 <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-8">
                    {mode === 'resetPassword' ? (
                        <div>
                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                <InputField id="email" type="email" placeholder="البريد الإلكتروني" value={email} onChange={setEmail} icon={emailIcon} />
                                <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors disabled:bg-teal-300 flex items-center justify-center mt-4">
                                    {loading ? <LoadingSpinner /> : 'إرسال رابط إعادة التعيين'}
                                </button>
                            </form>
                            <div className="text-center mt-4">
                                <button type="button" onClick={() => setMode('signIn')} className="text-sm font-semibold text-teal-500 hover:underline">
                                    العودة لتسجيل الدخول
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-center border-b-2 border-slate-200 dark:border-slate-700 mb-6">
                                <button onClick={() => setMode('signIn')} className={`w-1/2 pb-3 font-bold transition-colors ${mode === 'signIn' ? 'text-teal-500 border-b-2 border-teal-500' : 'text-slate-500'}`}>
                                    تسجيل الدخول
                                </button>
                                <button onClick={() => setMode('signUp')} className={`w-1/2 pb-3 font-bold transition-colors ${mode === 'signUp' ? 'text-teal-500 border-b-2 border-teal-500' : 'text-slate-500'}`}>
                                    إنشاء حساب
                                </button>
                            </div>

                            <form onSubmit={handleAuthAction} className="space-y-4">
                                {mode === 'signUp' && <InputField id="fullName" type="text" placeholder="الاسم الكامل" value={fullName} onChange={setFullName} icon={userIcon} />}
                                <InputField id="email" type="email" placeholder="البريد الإلكتروني" value={email} onChange={setEmail} icon={emailIcon} />
                                <InputField id="password" type="password" placeholder="كلمة المرور" value={password} onChange={setPassword} icon={passwordIcon} isPassword={true} />
                                {mode === 'signUp' && <InputField id="confirmPassword" type="password" placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={setConfirmPassword} icon={passwordIcon} isPassword={true} />}

                                <button type="submit" disabled={loading} className="w-full bg-teal-500 text-white font-bold p-4 rounded-lg shadow-lg hover:bg-teal-600 transition-colors disabled:bg-teal-300 flex items-center justify-center mt-4">
                                    {loading ? <LoadingSpinner /> : (mode === 'signIn' ? 'تسجيل الدخول' : 'إنشاء حساب')}
                                </button>
                            </form>

                             {mode === 'signIn' && (
                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('resetPassword');
                                            setError(null);
                                            setMessage(null);
                                        }}
                                        className="text-sm font-semibold text-teal-500 hover:underline"
                                    >
                                        نسيت كلمة المرور؟
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    {error && <p className="mt-4 text-center text-red-500 text-sm font-semibold">{error}</p>}
                    {message && <p className="mt-4 text-center text-green-500 text-sm font-semibold">{message}</p>}
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;