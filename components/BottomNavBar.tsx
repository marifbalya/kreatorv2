
import React from 'react';
import { Page, NavItem } from '../types';
import { BOTTOM_NAV_ITEMS } from '../constants';

interface BottomNavBarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activePage, onNavigate }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center text-xs p-2 rounded-md transition-colors w-1/3
                ${isActive 
                  ? 'text-indigo-400' 
                  : 'text-gray-400 hover:text-indigo-300 hover:bg-gray-700/50'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {IconComponent && <IconComponent className={`w-6 h-6 mb-0.5 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />}
              <span className={`truncate ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;