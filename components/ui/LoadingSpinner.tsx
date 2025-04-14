import React from 'react';

type LoadingSpinnerProps = {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
};

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`}></div>
      {message && <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">{message}</p>}
    </div>
  );
}
