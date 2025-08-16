import React from 'react';
import { Trophy, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "로딩 중..." 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Trophy className="text-yellow-500 mx-auto mb-4 animate-bounce" size={64} />
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="text-blue-600 animate-spin" size={32} />
            <h2 className="text-2xl font-bold text-gray-800">{message}</h2>
          </div>
        </div>
        
        <div className="space-y-2 text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
          <p className="text-sm">잠시만 기다려주세요...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
