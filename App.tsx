import React, { useState, useEffect } from 'react';
import MainApp from './MainApp';
import SetupScreen from './screens/SetupScreen';

const App: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage to see if the user has completed the setup process.
    const setupFlag = localStorage.getItem('isSetupComplete');
    setIsSetupComplete(setupFlag === 'true');
  }, []);

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
  };

  if (isSetupComplete === null) {
    // We are still checking, show a blank screen or a loading spinner
    return <div className="bg-slate-50 dark:bg-slate-900 min-h-screen" />;
  }

  return isSetupComplete ? <MainApp /> : <SetupScreen onSetupComplete={handleSetupComplete} />;
};

export default App;
