import React from 'react';
import { Screen } from '../types';
import HomeIcon from './icons/HomeIcon';
import LessonsIcon from './icons/LessonsIcon';
import ExercisesIcon from './icons/ExercisesIcon';
import AssistantIcon from './icons/AssistantIcon';
import ProfileIcon from './icons/ProfileIcon';
import CommunityIcon from './icons/CommunityIcon';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const NavItem: React.FC<{
  label: string;
  screen: Screen;
  Icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, Icon, isActive, onClick }) => {
  const activeClasses = 'text-teal-500';
  const inactiveClasses = 'text-slate-500';
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-full transition-transform duration-200 ease-in-out transform hover:scale-110"
      aria-label={label}
    >
      <Icon className={`w-7 h-7 mb-1 ${isActive ? activeClasses : inactiveClasses}`} />
      <span className={`text-xs font-bold ${isActive ? activeClasses : inactiveClasses}`}>{label}</span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
  const navItems: { label: string; screen: Screen; Icon: React.ElementType }[] = [
    { label: 'الرئيسية', screen: 'home', Icon: HomeIcon },
    { label: 'الدروس', screen: 'lessons', Icon: LessonsIcon },
    { label: 'التمارين', screen: 'exercises', Icon: ExercisesIcon },
    { label: 'المساعد', screen: 'assistant', Icon: AssistantIcon },
    { label: 'المجتمع', screen: 'community', Icon: CommunityIcon },
    { label: 'حسابي', screen: 'profile', Icon: ProfileIcon },
  ];

  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-white dark:bg-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto px-1">
        {navItems.map((item) => (
          <NavItem
            key={item.screen}
            label={item.label}
            screen={item.screen}
            Icon={item.Icon}
            isActive={activeScreen === item.screen}
            onClick={() => setActiveScreen(item.screen)}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;