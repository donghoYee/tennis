import React, { useState } from 'react';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';

interface CreateTournamentFormProps {
  onBack: () => void;
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ onBack }) => {
  const { createTournament } = useTournament();
  const [tournamentName, setTournamentName] = useState('');
  const [teamCount, setTeamCount] = useState(4);
  const [errors, setErrors] = useState<{name?: string; teamCount?: string}>({});

  const validateForm = () => {
    const newErrors: {name?: string; teamCount?: string} = {};

    if (!tournamentName.trim()) {
      newErrors.name = '대회 이름을 입력해주세요';
    }

    if (teamCount < 2) {
      newErrors.teamCount = '최소 2팀이 필요합니다';
    } else if (teamCount > 64) {
      newErrors.teamCount = '최대 64팀까지 가능합니다';
    } else if ((teamCount & (teamCount - 1)) !== 0) {
      // Check if teamCount is a power of 2
      const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teamCount)));
      const prevPowerOf2 = Math.pow(2, Math.floor(Math.log2(teamCount)));
      newErrors.teamCount = `팀 수는 2의 거듭제곱이어야 합니다 (${prevPowerOf2} 또는 ${nextPowerOf2})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      createTournament(tournamentName.trim(), teamCount);
      onBack(); // This will navigate to the tournament view
    }
  };

  const teamCountOptions = [2, 4, 8, 16, 32, 64];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2 sm:mb-4 
                     font-medium transition-colors duration-200 text-sm sm:text-base"
          >
            <ArrowLeft size={18} />
            대시보드로 돌아가기
          </button>
          
          <div className="text-center">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center justify-center gap-2 sm:gap-3">
              <Trophy className="text-yellow-500" size={28} />
              새 리그 만들기
            </h1>
            <p className="text-sm sm:text-base text-gray-600">대회 정보를 입력하여 토너먼트를 시작하세요</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Tournament Name */}
            <div>
              <label htmlFor="tournamentName" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                대회 이름
              </label>
              <input
                type="text"
                id="tournamentName"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-colors duration-200 text-sm sm:text-base ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="예: 2024 여름 테니스 대회"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Team Count */}
            <div>
              <label htmlFor="teamCount" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  참가 팀 수
                </div>
              </label>
              <select
                id="teamCount"
                value={teamCount}
                onChange={(e) => setTeamCount(Number(e.target.value))}
                className={`w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-colors duration-200 text-sm sm:text-base ${
                  errors.teamCount ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {teamCountOptions.map(count => (
                  <option key={count} value={count}>
                    {count}팀
                  </option>
                ))}
              </select>
              {errors.teamCount && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.teamCount}</p>
              )}
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                토너먼트 방식으로 진행되므로 2의 거듭제곱 개수의 팀이 필요합니다
              </p>
            </div>

            {/* Tournament Preview */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">대회 미리보기</h3>
              <div className="text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
                <p>• 참가 팀: {teamCount}팀</p>
                <p>• 총 경기 수: {teamCount - 1}경기</p>
                <p>• 라운드 수: {Math.ceil(Math.log2(teamCount))}라운드</p>
                <p>• 대회 방식: 단일 토너먼트</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:gap-4 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-4 py-2 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 rounded-lg 
                         hover:bg-gray-50 transition-colors duration-200 font-medium text-sm sm:text-base"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                         transition-colors duration-200 font-medium shadow-md text-sm sm:text-base"
              >
                대회 만들기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentForm;
