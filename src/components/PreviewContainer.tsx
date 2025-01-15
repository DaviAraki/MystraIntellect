import React from 'react';

interface PreviewContainerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function PreviewContainer({ title, onClose, children }: PreviewContainerProps) {
  return (
    <div className="sticky top-0 right-0 w-1/2 h-screen border-l border-gray-800 flex flex-col">
      <div className="p-2 bg-gray-900 text-green-400 flex justify-between items-center">
        <span>{title}</span>
        <button 
          onClick={onClose} 
          className="text-white hover:text-red-500"
          aria-label="Close preview"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  );
} 