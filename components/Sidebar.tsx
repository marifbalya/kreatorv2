
import React from 'react';
import { Page, NavItem } from '../types';
import { NAV_ITEMS } from '../constants';
import CloseIcon from './icons/CloseIcon';

interface SidebarProps {
  isOpen: boolean;
  activePage: Page;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activePage, onClose, onNavigate }) => {
  return (
    <>
      <div
        id="sidebar"
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 shadow-lg z-40 p-4 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sticky top-4">
          <button
            id="close-menu-btn"
            className="absolute top-0 right-4 text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
          <h2 className="text-2xl font-bold text-white mb-8">Menu</h2>
          <nav className="flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.id}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.id);
                  }}
                  className={`flex items-center space-x-3 text-base sm:text-lg p-3 rounded-lg transition-colors
                    ${activePage === item.id 
                      ? 'bg-indigo-600 text-white font-semibold' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0" />}
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
      {isOpen && (
        <div
          id="sidebar-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        ></div>
      )}
    </>
  );
};

export default Sidebar;