import React, { ReactNode } from 'react';
import { useStore } from '../store/StoreContext';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: string;
  onConfirm?: () => void;
  showConfirm?: boolean;
  showCancel?: boolean;
}

export const Modal = ({
  isOpen,
  title,
  children,
  onClose,
  confirmText = '确认',
  cancelText = '取消',
  confirmClass,
  onConfirm,
  showConfirm = true,
  showCancel = true,
}: ModalProps) => {
  const { darkMode } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 ${darkMode ? 'bg-black/60' : 'bg-black/40'}`}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md rounded-xl p-6 animate-slide-up ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {children}
        </div>
        {(showConfirm || showCancel) && (
          <div className="flex gap-3 mt-6 justify-end">
            {showCancel && (
              <Button variant="secondary" onClick={onClose} className="flex-1">
                {cancelText}
              </Button>
            )}
            {showConfirm && (
              <Button 
                variant={confirmClass ? 'none' : 'primary'} 
                onClick={onConfirm} 
                className={`flex-1 ${confirmClass || ''}`}
              >
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};