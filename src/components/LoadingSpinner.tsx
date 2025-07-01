import { Loader2, DollarSign, TrendingUp } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  subText?: string;
  variant?: 'default' | 'investment' | 'processing';
}

export const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  subText,
  variant = 'default' 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const containerClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12'
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'investment':
        return (
          <div className="relative">
            <div className={`animate-spin rounded-full ${sizeClasses[size]} border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 rounded-full`}></div>
            <div className={`absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center`}>
              <DollarSign className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'} text-blue-600`} />
            </div>
          </div>
        );
      case 'processing':
        return (
          <div className="relative">
            <div className={`animate-spin rounded-full ${sizeClasses[size]} border-4 border-transparent bg-gradient-to-r from-green-500 to-blue-500 rounded-full`}></div>
            <div className={`absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center`}>
              <TrendingUp className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'} text-green-600`} />
            </div>
          </div>
        );
      default:
        return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      {renderSpinner()}
      {text && (
        <p className={`mt-4 font-medium text-gray-900 dark:text-white ${textClasses[size]}`}>
          {text}
        </p>
      )}
      {subText && (
        <p className={`mt-2 text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {subText}
        </p>
      )}
    </div>
  );
};

