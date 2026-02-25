import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';
type ThemeColor = 'red' | 'orange' | 'green' | 'blue' | 'purple' | 'pink';

interface ThemeContextType {
  mode: ThemeMode;
  color: ThemeColor;
  setMode: (mode: ThemeMode) => void;
  setColor: (color: ThemeColor) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [color, setColor] = useState<ThemeColor>('red');

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    const savedColor = localStorage.getItem('theme-color') as ThemeColor;
    
    if (savedMode) setMode(savedMode);
    if (savedColor) setColor(savedColor);
  }, []);

  useEffect(() => {
    // Save to localStorage and apply to document
    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('theme-color', color);
    
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    root.classList.remove('theme-red', 'theme-orange', 'theme-green', 'theme-blue', 'theme-purple', 'theme-pink');
    
    // Add current theme classes
    root.classList.add(mode);
    root.classList.add(`theme-${color}`);
  }, [mode, color]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ mode, color, setMode, setColor, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}