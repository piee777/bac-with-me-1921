import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserProfile, Subject, Exercise, Flashcard, LeaderboardUser, PastExam, CommunityPost, CommunityAnswer, Lesson, QuizQuestion } from '../types';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { mockUser, mockSubjects, mockDailyChallenge, mockFlashcards, mockLeaderboard, mockPastExams, mockCommunityPosts } from '../constants';


// --- Data Transformation Helpers ---
const transformProfile = (profile: any, badges: any[]): UserProfile => ({
    id: profile.id,
    name: profile.name ?? 'مستخدم جديد',
    avatarUrl: profile.avatar_url ?? mockUser.avatarUrl,
    points: profile.points ?? 0,
    streak: profile.streak ?? 0,
    badges: badges ? badges.map(b => ({
        id: b.id,
        name: b.name,
        icon: b.icon ?? '🏆',
        description: b.description,
    })) : [],
});

const transformSubject = (subject: any): Subject => ({
    id: subject.id,
    name: subject.name,
    icon: subject.icon ?? '📚',
    color: subject.color ?? 'default',
    lessons: subject.lessons ? subject.lessons.map(transformLesson) : [],
});

const transformLesson = (lesson: any): Lesson => ({
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary ?? 'ملخص الدرس غير متوفر حالياً.',
    content: lesson.content ?? 'محتوى الدرس سيتم إضافته قريباً.',
    examples: lesson.examples ?? [],
    completed: lesson.completed ?? false,
    difficulty: (lesson.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
    imageUrl: lesson.image_url ?? undefined,
    videoUrl: lesson.video_url ?? undefined,
    pdfUrl: lesson.pdf_url ?? '#',
    audioUrl: lesson.audio_url ?? undefined,
    quiz: (lesson.quiz as QuizQuestion[] | null) ?? undefined,
});

const transformExercise = (exercise: any): Exercise => ({
    id: exercise.id,
    subject: exercise.subject,
    type: exercise.type as 'mcq' | 'true-false',
    question: exercise.question,
    options: exercise.options ?? undefined,
    correctAnswer: exercise.correct_answer,
});

const transformFlashcard = (flashcard: any): Flashcard => ({
    id: flashcard.id,
    subject: flashcard.subject,
    term: flashcard.term,
    definition: flashcard.definition,
});

const transformPastExam = (exam: any): PastExam => ({
    id: exam.id,
    subjectId: exam.subject_id,
    subjectName: exam.subject_name,
    year: exam.year,
    topicUrl: exam.topic_url ?? '#',
    solutionUrl: exam.solution_url ?? '#',
});

const transformPost = (post: any): CommunityPost => ({
    id: post.id,
    author: post.author,
    avatarUrl: post.avatar_url ?? `https://i.pravatar.cc/150?u=${post.author}`,
    question: post.question,
    subject: post.subject ?? 'عام',
    timestamp: post.created_at ? new Date(post.created_at).toLocaleString('ar-DZ', { day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric' }) : '',
    answers: post.answers ? post.answers.map(transformAnswer) : [],
});

const transformAnswer = (answer: any): CommunityAnswer => ({
    id: answer.id,
    author: answer.author,
    avatarUrl: answer.avatar_url ?? `https://i.pravatar.cc/150?u=${answer.author}`,
    text: answer.text,
    timestamp: answer.created_at ? new Date(answer.created_at).toLocaleString('ar-DZ', { hour: 'numeric', minute: 'numeric' }) : 'الآن',
});


// --- API Functions ---

export const fetchUserProfile = async (): Promise<UserProfile> => {
    // Authentication has been removed, always return the mock user.
    return Promise.resolve(mockUser);
};

export const fetchSubjects = async (): Promise<Subject[]> => {
    if (!isSupabaseConfigured) return mockSubjects;
    try {
        const { data, error } = await supabase.from('subjects').select('*, lessons(*)');
        if (error) throw error;
        if (data && data.length > 0) {
            return data.map(transformSubject);
        }
        console.warn('Supabase: No subjects found, falling back to mock data.');
        return mockSubjects;
    } catch (err) {
        console.error('API Error fetching subjects:', err);
        return mockSubjects;
    }
};

export const fetchDailyChallenge = async (): Promise<Exercise[]> => {
    if (!isSupabaseConfigured) return mockDailyChallenge;
    try {
        const { data, error } = await supabase.from('exercises').select('*').limit(5);
        if (error) throw error;
        if (data && data.length > 0) {
            return data.map(transformExercise);
        }
        console.warn('Supabase: No exercises found for daily challenge, falling back to mock data.');
        return mockDailyChallenge;
    } catch (err) {
        console.error('API Error fetching daily challenge:', err);
        return mockDailyChallenge;
    }
};

export const fetchFlashcards = async (): Promise<Flashcard[]> => {
    if (!isSupabaseConfigured) return mockFlashcards;
    try {
        const { data, error } = await supabase.from('flashcards').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
            return data.map(transformFlashcard);
        }
        console.warn('Supabase: No flashcards found, falling back to mock data.');
        return mockFlashcards;
    } catch(err) {
        console.error('API Error fetching flashcards:', err);
        return mockFlashcards;
    }
};

export const fetchExamQuestions = async (): Promise<Exercise[]> => {
    return fetchDailyChallenge();
};

export const fetchLeaderboard = async (): Promise<LeaderboardUser[]> => {
    if (!isSupabaseConfigured) return mockLeaderboard;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, points')
            .order('points', { ascending: false })
            .limit(10);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            return data.map((user, index) => ({
                id: user.id,
                name: user.id === mockUser.id ? `${user.name} (أنت)` : user.name,
                avatarUrl: user.avatar_url ?? 'https://i.imgur.com/E5J0f7L.jpeg',
                score: user.points ?? 0,
                rank: index + 1,
            }));
        }
        console.warn('Supabase: Leaderboard is empty, falling back to mock data.');
        return mockLeaderboard;
    } catch(err) {
        console.error('API Error fetching leaderboard:', err);
        return mockLeaderboard;
    }
};

export const fetchPastExams = async (): Promise<PastExam[]> => {
    if (!isSupabaseConfigured) return mockPastExams;
    try {
        const { data, error } = await supabase.from('past_exams').select('*').order('year', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
            return data.map(transformPastExam);
        }
        console.warn('Supabase: No past exams found, falling back to mock data.');
        return mockPastExams;
    } catch(err) {
        console.error('API Error fetching past exams:', err);
        return mockPastExams;
    }
};

export const fetchCommunityPosts = async (): Promise<CommunityPost[]> => {
    if (!isSupabaseConfigured) return mockCommunityPosts;
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*, answers(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
             return data.map(transformPost);
        }
        console.warn('Supabase: No community posts found, falling back to mock data.');
        return mockCommunityPosts;
    } catch(err) {
        console.error('API Error fetching community posts:', err);
        return mockCommunityPosts;
    }
};

export const addCommunityPost = async (question: string, subject: string): Promise<CommunityPost> => {
    // Authentication removed, using mock user for posting.
    const userProfile = mockUser;
    
    if (!isSupabaseConfigured) {
        const newPost = { id: new Date().toISOString(), question, subject, author: userProfile.name, avatarUrl: userProfile.avatarUrl, timestamp: 'الآن', answers: [] };
        mockCommunityPosts.unshift(newPost);
        return newPost;
    }

    const { data, error }: PostgrestSingleResponse<any> = await supabase
        .from('posts')
        .insert({
            question: question,
            subject: subject,
            author: userProfile.name,
            avatar_url: userProfile.avatarUrl,
        })
        .select('*, answers(*)')
        .single();
    
    if (error) throw error;
    return transformPost(data);
};

export const addCommunityAnswer = async (postId: string, answerText: string): Promise<CommunityAnswer> => {
    // Authentication removed, using mock user for answering.
    const userProfile = mockUser;

    if (!isSupabaseConfigured) {
        const newAnswer = { id: new Date().toISOString(), text: answerText, author: userProfile.name, avatarUrl: userProfile.avatarUrl, timestamp: 'الآن' };
        const postIndex = mockCommunityPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) mockCommunityPosts[postIndex].answers.push(newAnswer);
        return newAnswer;
    }

    const { data, error }: PostgrestSingleResponse<any> = await supabase
        .from('answers')
        .insert({
            post_id: postId,
            text: answerText,
            author: userProfile.name,
            avatar_url: userProfile.avatarUrl,
        })
        .select('*')
        .single();
        
    if (error) throw error;
    return transformAnswer(data);
};
