import React, { ReactNode } from 'react';
import { useStore } from '../store/StoreContext';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = ({ children, className = '', onClick }: CardProps) => {
  const { darkMode } = useStore();

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 shadow-sm transition-all ${
        darkMode
          ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
          : 'bg-white border border-gray-100 hover:shadow-md'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};