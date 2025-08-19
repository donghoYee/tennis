import React, { useState } from 'react';
import { ArrowLeft, Edit3, Trophy, Users, Calendar, FileText, Download } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import type { Match, Team } from '../types/tournament';

interface TournamentBracketProps {
  onBack: () => void;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ onBack }) => {
  const { currentTournament, updateTeamName, updateMatchScore } = useTournament();
  const { isAdmin } = useAuth();
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [scoreInputs, setScoreInputs] = useState<{score1: string; score2: string}>({score1: '', score2: ''});
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkTeamNames, setBulkTeamNames] = useState('');

  if (!currentTournament) {
    return <div>대회를 찾을 수 없습니다.</div>;
  }

  const handleTeamNameEdit = (team: Team) => {
    setEditingTeam(team.id);
    setTeamNameInput(team.name);
  };

  const handleTeamNameSave = () => {
    if (editingTeam && teamNameInput.trim()) {
      updateTeamName(editingTeam, teamNameInput.trim());
    }
    setEditingTeam(null);
    setTeamNameInput('');
  };

  const handleMatchEdit = (match: Match) => {
    setEditingMatch(match.id);
    setScoreInputs({
      score1: match.score1?.toString() || '',
      score2: match.score2?.toString() || ''
    });
  };

  const handleMatchSave = () => {
    if (editingMatch) {
      const score1 = parseInt(scoreInputs.score1) || 0;
      const score2 = parseInt(scoreInputs.score2) || 0;
      updateMatchScore(editingMatch, score1, score2);
    }
    setEditingMatch(null);
    setScoreInputs({score1: '', score2: ''});
  };

  const handleBulkTeamInput = () => {
    if (!bulkTeamNames.trim()) return;
    
    // 쉼표와 줄바꿈으로 구분된 팀명들을 파싱
    const teamNames = bulkTeamNames
      .split(/[,\n]/)  // 쉼표 또는 줄바꿈으로 분할
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // 팀 개수만큼만 처리 (초과하는 팀명은 무시)
    const teamsToUpdate = currentTournament.teams.slice(0, teamNames.length);
    
    // 각 팀의 이름을 업데이트
    teamsToUpdate.forEach((team, index) => {
      if (teamNames[index]) {
        updateTeamName(team.id, teamNames[index]);
      }
    });
    
    // 모달 닫기 및 입력 초기화
    setShowBulkInput(false);
    setBulkTeamNames('');
  };

  const handleBulkInputOpen = () => {
    // 현재 팀명들을 줄바꿈으로 구분된 문자열로 초기화
    const currentTeamNames = currentTournament.teams
      .map(team => team.name)
      .join('\n');
    setBulkTeamNames(currentTeamNames);
    setShowBulkInput(true);
  };

  const handleExportResults = async () => {
    try {
      await apiService.exportTournamentResults(currentTournament.id, currentTournament.name);
    } catch (error) {
      console.error('Export failed:', error);
      alert('익스포트에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleExportPDF = async () => {
    try {
      await apiService.exportTournamentResultsPDF(currentTournament.id, currentTournament.name);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF 익스포트에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const groupMatchesByRound = () => {
    const roundMatches: { [key: number]: Match[] } = {};
    currentTournament.matches.forEach(match => {
      if (!roundMatches[match.round]) {
        roundMatches[match.round] = [];
      }
      roundMatches[match.round].push(match);
    });
    return roundMatches;
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return '결승';
    if (round === totalRounds - 1) return '준결승';
    if (round === totalRounds - 2) return '8강';
    if (round === totalRounds - 3) return '16강';
    return `${round}라운드`;
  };

  const roundMatches = groupMatchesByRound();
  const totalRounds = Math.max(...currentTournament.matches.map(m => m.round));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
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
          
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Trophy className="text-yellow-500" size={24} />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-800">{currentTournament.name}</h1>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {currentTournament.teamCount}팀
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(currentTournament.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">진행률</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {Math.round(
                    (currentTournament.matches.filter(m => m.winner).length / currentTournament.matches.length) * 100
                  )}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teams Section - 관리자만 표시 */}
        {isAdmin && (
          <div className="mb-4 sm:mb-8">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">참가 팀</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleBulkInputOpen}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors duration-200 text-xs sm:text-sm font-medium"
                >
                  <FileText size={14} />
                  팀명 일괄 입력
                </button>
                <button
                  onClick={handleExportResults}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                           transition-colors duration-200 text-xs sm:text-sm font-medium"
                >
                  <Download size={14} />
                  Excel 익스포트
                </button>
              </div>
            </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {currentTournament.teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow">
                {editingTeam === team.id ? (
                  <div>
                    <input
                      type="text"
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-xs sm:text-sm"
                      onBlur={handleTeamNameSave}
                      onKeyPress={(e) => e.key === 'Enter' && handleTeamNameSave()}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => handleTeamNameEdit(team)}
                  >
                    <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">{team.name}</span>
                    <Edit3 className="text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
        )}

        {/* Bracket */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">대진표</h2>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                       transition-colors duration-200 text-xs sm:text-sm font-medium"
            >
              <Download size={14} />
              PDF 다운로드
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <div className="flex gap-4 sm:gap-8 min-w-max">
              {Object.entries(roundMatches)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([round, matches]) => (
                <div key={round} className="flex flex-col">
                  <h3 className="text-sm sm:text-lg font-semibold text-center mb-2 sm:mb-4 text-gray-700">
                    {getRoundName(parseInt(round), totalRounds)}
                  </h3>
                  
                  <div className="space-y-3 sm:space-y-6">
                    {matches
                      .sort((a, b) => a.matchIndex - b.matchIndex)
                      .map((match) => (
                      <div key={match.id} className="bg-gray-50 rounded-lg p-2 sm:p-4 min-w-[200px] sm:min-w-[250px]">
                        {/* Team 1 */}
                        <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg mb-1 sm:mb-2 ${
                          match.winner?.id === match.team1?.id ? 'bg-green-100 border-2 border-green-500' : 'bg-white border-2 border-gray-200'
                        }`}>
                          <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                            {match.team1?.name || 'TBD'}
                          </span>
                          <span className="text-sm sm:text-lg font-bold text-gray-700 ml-2">
                            {match.score1 ?? '-'}
                          </span>
                        </div>
                        
                        {/* VS */}
                        <div className="text-center text-gray-500 text-xs sm:text-sm font-medium mb-1 sm:mb-2">VS</div>
                        
                        {/* Team 2 */}
                        <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 ${
                          match.winner?.id === match.team2?.id ? 'bg-green-100 border-2 border-green-500' : 'bg-white border-2 border-gray-200'
                        }`}>
                          <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                            {match.team2?.name || 'TBD'}
                          </span>
                          <span className="text-sm sm:text-lg font-bold text-gray-700 ml-2">
                            {match.score2 ?? '-'}
                          </span>
                        </div>
                        
                        {/* Edit Score Button */}
                        {match.team1 && match.team2 && (
                          <div className="text-center">
                            {editingMatch === match.id ? (
                              <div className="space-y-1 sm:space-y-2">
                                <div className="flex gap-1 sm:gap-2">
                                  <input
                                    type="number"
                                    placeholder="점수1"
                                    value={scoreInputs.score1}
                                    onChange={(e) => setScoreInputs(prev => ({...prev, score1: e.target.value}))}
                                    className="flex-1 px-1 sm:px-2 py-1 border rounded text-xs sm:text-sm"
                                    min="0"
                                  />
                                  <input
                                    type="number"
                                    placeholder="점수2"
                                    value={scoreInputs.score2}
                                    onChange={(e) => setScoreInputs(prev => ({...prev, score2: e.target.value}))}
                                    className="flex-1 px-1 sm:px-2 py-1 border rounded text-xs sm:text-sm"
                                    min="0"
                                  />
                                </div>
                                <button
                                  onClick={handleMatchSave}
                                  className="w-full px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700"
                                >
                                  저장
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleMatchEdit(match)}
                                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors"
                              >
                                점수 입력
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Team Input Modal - 관리자만 표시 */}
        {isAdmin && showBulkInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">팀명 일괄 입력</h3>
                
                <div className="mb-3 sm:mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    팀명을 쉼표(,) 또는 줄바꿈으로 구분하여 입력하세요. 총 {currentTournament.teamCount}개 팀까지 입력 가능합니다.
                  </p>
                  <p className="text-xs text-gray-500">
                    예: 팀A, 팀B, 팀C 또는 한 줄에 하나씩 입력
                  </p>
                </div>

                <textarea
                  value={bulkTeamNames}
                  onChange={(e) => setBulkTeamNames(e.target.value)}
                  placeholder="팀명1, 팀명2, 팀명3 또는&#10;팀명1&#10;팀명2&#10;팀명3"
                  className="w-full h-32 sm:h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 
                           focus:border-blue-500 resize-none text-sm"
                />

                <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                  입력된 팀 수: {bulkTeamNames.split(/[,\n]/).filter(name => name.trim().length > 0).length}개
                </div>

                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    onClick={() => {
                      setShowBulkInput(false);
                      setBulkTeamNames('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 
                             transition-colors duration-200 text-sm sm:text-base font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleBulkTeamInput}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                             transition-colors duration-200 text-sm sm:text-base font-medium"
                  >
                    적용
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentBracket;
