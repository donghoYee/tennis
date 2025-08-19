import React, { useState } from 'react';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { useQualifier } from '../context/QualifierContext';

interface CreateQualifierFormProps {
  onBack: () => void;
}

const CreateQualifierForm: React.FC<CreateQualifierFormProps> = ({ onBack }) => {
  const [qualifierName, setQualifierName] = useState('');
  const [teamCount, setTeamCount] = useState(16);
  const { createQualifier, isCreatingQualifier } = useQualifier();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qualifierName.trim()) {
      await createQualifier(qualifierName.trim(), teamCount);
      onBack();
    }
  };

  const teamCountOptions = [4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 sm:p-6 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg sm:p-8 p-6">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="sm:text-3xl text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Trophy className="sm:w-8 sm:h-8 w-6 h-6 text-yellow-500" />
                새 예선전 만들기
              </h1>
              <p className="text-gray-600 mt-2 sm:text-base text-sm">
                예선전을 생성하여 팀들을 1:1로 매칭합니다
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="qualifierName" className="block sm:text-sm text-xs font-medium text-gray-700 mb-2">
                예선전 이름
              </label>
              <input
                type="text"
                id="qualifierName"
                value={qualifierName}
                onChange={(e) => setQualifierName(e.target.value)}
                className="w-full sm:px-4 sm:py-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-base text-sm"
                placeholder="예: 2024 청년부 예선전"
                required
              />
            </div>

            <div>
              <label htmlFor="teamCount" className="block sm:text-sm text-xs font-medium text-gray-700 mb-2">
                참가팀 수
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 sm:w-5 sm:h-5 w-4 h-4" />
                <select
                  id="teamCount"
                  value={teamCount}
                  onChange={(e) => setTeamCount(Number(e.target.value))}
                  className="w-full sm:pl-12 sm:pr-4 sm:py-3 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white sm:text-base text-sm"
                >
                  {teamCountOptions.map((count) => (
                    <option key={count} value={count}>
                      {count}팀 ({Math.floor(count / 2)}경기)
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-gray-500 sm:text-sm text-xs mt-2">
                예선전은 2팀씩 매칭되어 {Math.floor(teamCount / 2)}개의 경기가 생성됩니다
              </p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 sm:px-6 sm:py-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors sm:text-base text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isCreatingQualifier || !qualifierName.trim()}
                  className="flex-1 sm:px-6 sm:py-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:text-base text-sm"
                >
                  {isCreatingQualifier ? '생성 중...' : '예선전 생성'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateQualifierForm;
