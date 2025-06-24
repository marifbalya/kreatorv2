
import React from 'react';
import MagicIcon from './icons/MagicIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface OptimizePromptButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const OptimizePromptButton: React.FC<OptimizePromptButtonProps> = ({ onClick, isLoading, disabled }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || disabled}
      className="absolute top-3 right-3 text-gray-400 hover:text-indigo-400 transition disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      title="Optimasi Prompt"
    >
      {isLoading ? <SpinnerIcon /> : <MagicIcon />}
    </button>
  );
};

export default OptimizePromptButton;