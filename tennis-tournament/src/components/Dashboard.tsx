import React, { useState } from 'react';
import { Trophy, Calendar, Users, Trash2, Lock, LogOut, Target } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { useQualifier } from '../context/QualifierContext';
import { useAuth } from '../context/AuthContext';
import type { Tournament, Qualifier } from '../types/tournament';

interface DashboardProps {
  onCreateTournament: () => void;
  onCreateQualifier: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCreateTournament, onCreateQualifier }) => {
  const { tournaments, selectTournament, deleteTournament } = useTournament();
  const { qualifiers, selectQualifier, deleteQualifier } = useQualifier();
  const { isAdmin, login, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleTournamentClick = (tournament: Tournament) => {
    selectTournament(tournament);
  };

  const handleQualifierClick = (qualifier: Qualifier) => {
    selectQualifier(qualifier);
  };

  const handleDeleteTournament = (e: React.MouseEvent, tournamentId: string) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 대회를 삭제하시겠습니까?')) {
      deleteTournament(tournamentId);
    }
  };

  const handleDeleteQualifier = (e: React.MouseEvent, qualifierId: string) => {
    e.stopPropagation();
    if (window.confirm('정말로 이 예선전을 삭제하시겠습니까?')) {
      deleteQualifier(qualifierId);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      setShowLoginModal(false);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('잘못된 비밀번호입니다.');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          {/* Admin Controls */}
          <div className="flex justify-end mb-2 sm:mb-4">
            {isAdmin ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 text-sm text-red-600 hover:text-red-700 
                         hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                <LogOut size={16} />
                관리자 로그아웃
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 text-sm text-blue-600 hover:text-blue-700 
                         hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <Lock size={16} />
                관리자로 로그인하기
              </button>
            )}
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center justify-center gap-2 sm:gap-3">
              <Trophy className="text-yellow-500" size={28} />
              <span className="hidden sm:inline">테니스 토너먼트 관리</span>
              <span className="sm:hidden">토너먼트 관리</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {isAdmin ? '대회를 생성하고 관리하세요' : '토너먼트 대진표를 확인하세요'}
            </p>
          </div>
        </div>

        {/* Create Buttons - 관리자만 표시 */}
        {isAdmin && (
          <div className="mb-4 sm:mb-8 text-center">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={onCreateTournament}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold 
                         shadow-lg transform transition duration-200 hover:scale-105 flex items-center gap-2 sm:gap-3 justify-center text-sm sm:text-base"
              >
                <Trophy size={18} />
                새 토너먼트 만들기
              </button>
              <button
                onClick={onCreateQualifier}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold 
                         shadow-lg transform transition duration-200 hover:scale-105 flex items-center gap-2 sm:gap-3 justify-center text-sm sm:text-base"
              >
                <Target size={18} />
                새 예선전 만들기
              </button>
            </div>
          </div>
        )}

        {/* Tournaments and Qualifiers Grid */}
        {tournaments.length === 0 && qualifiers.length === 0 ? (
          <div className="text-center py-8 sm:py-16">
            <Trophy className="mx-auto text-gray-400 mb-2 sm:mb-4" size={48} />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-1 sm:mb-2">아직 대회가 없습니다</h3>
            <p className="text-sm sm:text-base text-gray-500">첫 번째 대회를 만들어보세요!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tournaments Section */}
            {tournaments.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Trophy className="text-yellow-500" size={24} />
                  토너먼트
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {tournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      onClick={() => handleTournamentClick(tournament)}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 
                               cursor-pointer transform hover:scale-105 relative group"
                    >
                      {/* Delete Button - 관리자만 표시 */}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteTournament(e, tournament.id)}
                          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 
                                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                   hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}

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
                                const totalMatches = tournament.total_matches || 0;
                                const completedMatches = tournament.completed_matches || 0;
                                const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
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
              </div>
            )}

            {/* Qualifiers Section */}
            {qualifiers.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="text-green-500" size={24} />
                  예선전
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {qualifiers.map((qualifier) => (
                    <div
                      key={qualifier.id}
                      onClick={() => handleQualifierClick(qualifier)}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 
                               cursor-pointer transform hover:scale-105 relative group border-l-4 border-green-500"
                    >
                      {/* Delete Button - 관리자만 표시 */}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteQualifier(e, qualifier.id)}
                          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 
                                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                   hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}

                      <div className="p-3 sm:p-6">
                        {/* Qualifier Status */}
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                          <span className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium ${
                            (() => {
                              const totalMatches = qualifier.total_matches || 0;
                              const completedMatches = qualifier.completed_matches || 0;
                              const isCompleted = totalMatches > 0 && completedMatches >= totalMatches;
                              return isCompleted 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800';
                            })()
                          }`}>
                            {(() => {
                              const totalMatches = qualifier.total_matches || 0;
                              const completedMatches = qualifier.completed_matches || 0;
                              const isCompleted = totalMatches > 0 && completedMatches >= totalMatches;
                              return isCompleted ? '완료' : '진행중';
                            })()}
                          </span>
                          <Target className="text-green-500" size={20} />
                        </div>

                        {/* Qualifier Name */}
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 line-clamp-2">
                          {qualifier.name}
                        </h3>

                        {/* Qualifier Info */}
                        <div className="space-y-1 sm:space-y-2 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span className="text-xs sm:text-sm">{qualifier.teamCount}팀 참가</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span className="text-xs sm:text-sm">
                              {new Date(qualifier.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy size={14} />
                            <span className="text-xs sm:text-sm">{Math.floor(qualifier.teamCount / 2)}경기</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-2 sm:mt-4">
                          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                            <span>진행률</span>
                            <span>
                              {(() => {
                                const totalMatches = qualifier.total_matches || 0;
                                const completedMatches = qualifier.completed_matches || 0;
                                const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
                                return `${progress}%`;
                              })()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(() => {
                                  const totalMatches = qualifier.total_matches || 0;
                                  const completedMatches = qualifier.completed_matches || 0;
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
              </div>
            )}
          </div>
        )}

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">관리자 로그인</h3>
                
                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      비밀번호
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                               focus:border-blue-500"
                      placeholder="관리자 비밀번호를 입력하세요"
                      autoFocus
                    />
                    {loginError && (
                      <p className="mt-2 text-sm text-red-600">{loginError}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLoginModal(false);
                        setPassword('');
                        setLoginError('');
                      }}
                      className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 
                               border border-gray-300 rounded-lg transition-colors duration-200"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                               transition-colors duration-200"
                    >
                      로그인
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
