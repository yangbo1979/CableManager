import React from 'react';
import { useStore } from '../store/StoreContext';

interface InputProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'textarea';
  value?: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  min,
  max,
  className = '',
}: InputProps) => {
  const { darkMode } = useStore();

  return (
    <div className={`mb-4 ${className}`}>
      <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 rounded-lg border transition-colors resize-none ${
            darkMode
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-secondary'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-secondary'
          }`}
          rows={3}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className={`w-full px-3 py-2 rounded-lg border transition-colors ${
            darkMode
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-secondary'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-secondary'
          }`}
        />
      )}
    </div>
  );
};