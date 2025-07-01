import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from './LoadingSpinner';
import { CheckCircle, Clock, Wifi } from 'lucide-react';

interface ProcessingOverlayProps {
  isVisible: boolean;
  title: string;
  description: string;
  steps?: string[];
  currentStep?: number;
  variant?: 'deposit' | 'withdrawal' | 'general';
  onComplete?: () => void;
}

export const ProcessingOverlay = ({
  isVisible,
  title,
  description,
  steps = [],
  currentStep = 0,
  variant = 'general',
  onComplete
}: ProcessingOverlayProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete?.();
          }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  useEffect(() => {
    if (steps.length > 0) {
      const stepProgress = Math.floor(progress / (100 / steps.length));
      setCurrentStepIndex(Math.min(stepProgress, steps.length - 1));
    }
  }, [progress, steps.length]);

  if (!isVisible) return null;

  const getVariantConfig = () => {
    switch (variant) {
      case 'deposit':
        return {
          color: 'from-blue-500 to-purple-500',
          icon: 'investment',
          bgColor: 'from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
        };
      case 'withdrawal':
        return {
          color: 'from-green-500 to-blue-500',
          icon: 'processing',
          bgColor: 'from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20'
        };
      default:
        return {
          color: 'from-gray-500 to-gray-600',
          icon: 'default',
          bgColor: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900'
        };
    }
  };

  const config = getVariantConfig();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md bg-gradient-to-br ${config.bgColor} border-0 shadow-2xl`}>
        <CardContent className="p-8">
          <div className="text-center">
            <LoadingSpinner 
              size="lg" 
              variant={config.icon as any}
              text={title}
              subText={description}
            />

            {/* Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress 
                value={progress} 
                className="h-2"
              />
            </div>

            {/* Steps */}
            {steps.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Processing Steps:</h4>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div 
                      key={index}
                      className={`flex items-center space-x-3 text-sm transition-all duration-300 ${
                        index < currentStepIndex 
                          ? 'text-green-600 dark:text-green-400' 
                          : index === currentStepIndex 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : index === currentStepIndex ? (
                        <Clock className="h-4 w-4 animate-pulse" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                      )}
                      <span className={index === currentStepIndex ? 'font-medium' : ''}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connection Status */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Wifi className="h-3 w-3" />
              <span>Secure connection established</span>
            </div>

            {/* Estimated Time */}
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Estimated time: {variant === 'deposit' ? '1-5 minutes' : variant === 'withdrawal' ? '1-3 minutes' : '30 seconds'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

