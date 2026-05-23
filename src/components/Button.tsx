import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'icon' | 'none';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary disabled:bg-gray-300 disabled:cursor-not-allowed',
    secondary: 'bg-white text-primary border border-primary hover:bg-primary/5 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed',
    icon: 'p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
    none: '',
  };

  const darkVariantStyles = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary disabled:bg-gray-600 disabled:cursor-not-allowed',
    secondary: 'bg-gray-800 text-secondary border border-secondary hover:bg-gray-700 focus:ring-secondary disabled:bg-gray-700 disabled:text-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed',
    icon: 'p-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed',
    none: '',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};