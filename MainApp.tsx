import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import HomeScreen from './screens/HomeScreen';
import LessonsScreen from './screens/LessonsScreen';
import ExercisesScreen from './screens/ExercisesScreen';
import AssistantScreen from './screens/AssistantScreen';
import ProfileScreen from './screens/ProfileScreen';
import { Screen } from './types';
import CommunityScreen from './screens/CommunityScreen';
import QuickReviewScreen from './screens/QuickReviewScreen';
import ExamScreen from './screens/ExamScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import PastExamsScreen from './screens/PastExamsScreen';

const MainApp: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen setActiveScreen={setActiveScreen} theme={theme} toggleTheme={toggleTheme} />;
      case 'lessons':
        return <LessonsScreen />;
      case 'exercises':
        return <ExercisesScreen />;
      case 'assistant':
        return <AssistantScreen />;
      case 'community':
        return <CommunityScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'quick-review':
        return <QuickReviewScreen setActiveScreen={setActiveScreen} />;
      case 'exam':
        return <ExamScreen setActiveScreen={setActiveScreen} />;
      case 'leaderboard':
        return <LeaderboardScreen setActiveScreen={setActiveScreen} />;
      case 'past-exams':
        return <PastExamsScreen setActiveScreen={setActiveScreen} />;
      default:
        return <HomeScreen setActiveScreen={setActiveScreen} theme={theme} toggleTheme={toggleTheme} />;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <main className="pb-24">
        {renderScreen()}
      </main>
      <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
    </div>
  );
};

export default MainApp;
