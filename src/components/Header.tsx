import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
      <button
        className="p-1 mr-4 rounded-md lg:hidden hover:bg-gray-200 dark:hover:bg-gray-700"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="text-lg font-semibold hidden sm:block">
        PC Power Consumption Monitor
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={toggleTheme}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;