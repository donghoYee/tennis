import React from 'react';
import { Plus, Trophy, Calendar, Users, Trash2 } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import type { Tournament } from '../types/tournament';

interface DashboardProps {
  onCreateTournament: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateTournament }) => {
  const { tournaments, selectTournament, deleteTournament } = useTournament();

  const handleTournamentClick = (tournament: Tournament) => {
    selectTournament(tournament);
  };

  const handleDeleteTournament = (e: React.MouseEvent, tournamentId: string) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 대회를 삭제하시겠습니까?')) {
      deleteTournament(tournamentId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center justify-center gap-2 sm:gap-3">
            <Trophy className="text-yellow-500" size={28} />
            <span className="hidden sm:inline">테니스 토너먼트 관리</span>
            <span className="sm:hidden">토너먼트 관리</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">대회를 생성하고 관리하세요</p>
        </div>

        {/* Create Tournament Button */}
        <div className="mb-4 sm:mb-8 text-center">
          <button
            onClick={onCreateTournament}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-8 sm:py-4 rounded-lg font-semibold 
                     shadow-lg transform transition duration-200 hover:scale-105 flex items-center gap-2 sm:gap-3 mx-auto text-sm sm:text-base"
          >
            <Plus size={20} />
            새 대회 만들기
          </button>
        </div>

        {/* Tournaments Grid */}
        {tournaments.length === 0 ? (
          <div className="text-center py-8 sm:py-16">
            <Trophy className="mx-auto text-gray-400 mb-2 sm:mb-4" size={48} />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-1 sm:mb-2">아직 대회가 없습니다</h3>
            <p className="text-sm sm:text-base text-gray-500">첫 번째 대회를 만들어보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                onClick={() => handleTournamentClick(tournament)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 
                         cursor-pointer transform hover:scale-105 relative group"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteTournament(e, tournament.id)}
                  className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           hover:bg-red-50 rounded-full"
                >
                  <Trash2 size={18} />
                </button>

                <div className="p-3 sm:p-6">
                  {/* Tournament Status */}
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <span className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium ${
                      (() => {
                        const totalMatches = tournament.total_matches || 0;
                        const completedMatches = tournament.completed_matches || 0;
                        const isCompleted = totalMatches > 0 && completedMatches >= totalMatches;
                        return isCompleted 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800';
                      })()
                    }`}>
                      {(() => {
                        const totalMatches = tournament.total_matches || 0;
                        const completedMatches = tournament.completed_matches || 0;
                        const isCompleted = totalMatches > 0 && completedMatches >= totalMatches;
                        return isCompleted ? '완료' : '진행중';
                      })()}
                    </span>
                    <Trophy className="text-yellow-500" size={20} />
                  </div>

                  {/* Tournament Name */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 line-clamp-2">
                    {tournament.name}
                  </h3>

                  {/* Tournament Info */}
                  <div className="space-y-1 sm:space-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      <span className="text-xs sm:text-sm">{tournament.teamCount}팀 참가</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span className="text-xs sm:text-sm">
                        {new Date(tournament.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-2 sm:mt-4">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                      <span>진행률</span>
                      <span>
                        {(() => {
                          // Use backend-provided progress data
                          const totalMatches = tournament.total_matches || 0;
                          const completedMatches = tournament.completed_matches || 0;
                          const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
                          console.log(`Tournament ${tournament.name}: ${completedMatches}/${totalMatches} = ${progress}%`);
                          return `${progress}%`;
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(() => {
                            const totalMatches = tournament.total_matches || 0;
                            const completedMatches = tournament.completed_matches || 0;
                            return totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;
                          })()}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
