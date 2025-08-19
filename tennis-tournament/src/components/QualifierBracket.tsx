import React, { useState } from 'react';
import { ArrowLeft, Edit2, Save, X, Trophy, Users, FileText, Download } from 'lucide-react';
import { useQualifier } from '../context/QualifierContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import type { QualifierMatch, QualifierTeam } from '../types/tournament';

interface QualifierBracketProps {
  onBack: () => void;
}

const QualifierBracket: React.FC<QualifierBracketProps> = ({ onBack }) => {
  const { currentQualifier, updateQualifierTeamName, updateQualifierMatchScore } = useQualifier();
  const { isAdmin } = useAuth();
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editingScore1, setEditingScore1] = useState('');
  const [editingScore2, setEditingScore2] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkTeamNames, setBulkTeamNames] = useState('');

  if (!currentQualifier) {
    return <div>Loading...</div>;
  }

  const handleTeamNameEdit = (teamId: string, currentName: string) => {
    setEditingTeam(teamId);
    setEditingTeamName(currentName);
  };

  const handleTeamNameSave = async () => {
    if (editingTeam && editingTeamName.trim()) {
      await updateQualifierTeamName(editingTeam, editingTeamName.trim());
      setEditingTeam(null);
      setEditingTeamName('');
    }
  };

  const handleTeamNameCancel = () => {
    setEditingTeam(null);
    setEditingTeamName('');
  };

  const handleMatchEdit = (match: QualifierMatch) => {
    setEditingMatch(match.id);
    setEditingScore1(match.score1?.toString() || '');
    setEditingScore2(match.score2?.toString() || '');
  };

  const handleMatchSave = async () => {
    if (editingMatch) {
      const score1 = parseInt(editingScore1) || 0;
      const score2 = parseInt(editingScore2) || 0;
      await updateQualifierMatchScore(editingMatch, score1, score2);
      setEditingMatch(null);
      setEditingScore1('');
      setEditingScore2('');
    }
  };

  const handleMatchCancel = () => {
    setEditingMatch(null);
    setEditingScore1('');
    setEditingScore2('');
  };

  const handleBulkInputOpen = () => {
    const teamNames = currentQualifier.teams.map(team => team.name).join('\n');
    setBulkTeamNames(teamNames);
    setShowBulkInput(true);
  };

  const handleBulkTeamInput = async () => {
    const names = bulkTeamNames.split(/[,\n]/).map(name => name.trim()).filter(name => name);
    
    for (let i = 0; i < Math.min(names.length, currentQualifier.teams.length); i++) {
      if (names[i] && names[i] !== currentQualifier.teams[i].name) {
        await updateQualifierTeamName(currentQualifier.teams[i].id, names[i]);
      }
    }
    
    setShowBulkInput(false);
    setBulkTeamNames('');
  };

  const handleExportResults = async () => {
    try {
      await apiService.exportQualifierResults(currentQualifier.id, currentQualifier.name);
    } catch (error) {
      console.error('Export failed:', error);
      alert('익스포트에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const completedMatches = currentQualifier.matches.filter(m => m.winner).length;
  const totalMatches = currentQualifier.matches.length;
  const progressPercentage = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 sm:p-6 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg sm:p-6 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="self-start p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="sm:text-2xl text-xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="sm:w-6 sm:h-6 w-5 h-5 text-yellow-500" />
                {currentQualifier.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:text-sm text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {currentQualifier.teamCount}팀 참가
                </span>
                <span className="hidden sm:inline">•</span>
                <span>{completedMatches}/{totalMatches} 경기 완료</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-blue-600 font-medium">
                  {progressPercentage.toFixed(0)}% 진행
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Teams Section - Only visible to admins */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-lg sm:p-6 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="sm:text-xl text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="sm:w-5 sm:h-5 w-4 h-4 text-blue-600" />
                참가 팀
              </h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleBulkInputOpen}
                  className="flex items-center gap-2 sm:px-4 sm:py-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors sm:text-sm text-xs"
                >
                  <FileText className="sm:w-4 sm:h-4 w-3 h-3" />
                  팀명 일괄 입력
                </button>
                <button
                  onClick={handleExportResults}
                  className="flex items-center gap-2 sm:px-4 sm:py-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors sm:text-sm text-xs"
                >
                  <Download className="sm:w-4 sm:h-4 w-3 h-3" />
                  결과 익스포트
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {currentQualifier.teams.map((team: QualifierTeam) => (
                <div key={team.id} className="bg-gray-50 rounded-lg sm:p-3 p-2 border">
                  {editingTeam === team.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingTeamName}
                        onChange={(e) => setEditingTeamName(e.target.value)}
                        className="w-full sm:px-2 sm:py-1 px-1.5 py-0.5 border border-gray-300 rounded sm:text-sm text-xs"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={handleTeamNameSave}
                          className="flex-1 sm:p-1 p-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          <Save className="sm:w-3 sm:h-3 w-2.5 h-2.5 mx-auto" />
                        </button>
                        <button
                          onClick={handleTeamNameCancel}
                          className="flex-1 sm:p-1 p-0.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          <X className="sm:w-3 sm:h-3 w-2.5 h-2.5 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-100 rounded sm:p-1 p-0.5"
                      onClick={() => handleTeamNameEdit(team.id, team.name)}
                    >
                      <span className="sm:text-sm text-xs font-medium truncate">{team.name}</span>
                      <Edit2 className="sm:w-3 sm:h-3 w-2.5 h-2.5 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matches Section */}
        <div className="bg-white rounded-lg shadow-lg sm:p-6 p-4">
          <h2 className="sm:text-xl text-lg font-bold text-gray-900 mb-4">예선전 경기</h2>
          
          {/* Grid Layout for Matches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentQualifier.matches.map((match: QualifierMatch) => (
              <div key={match.id} className="border border-gray-200 rounded-lg sm:p-4 p-3 hover:shadow-md transition-shadow bg-gray-50">
                {/* Match Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="sm:text-sm text-xs text-gray-500 font-medium">
                    경기 {match.matchIndex + 1}
                  </span>
                  {match.winner && (
                    <span className="sm:text-xs text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      완료
                    </span>
                  )}
                </div>
                
                {/* Teams and Scores */}
                <div className="space-y-3 mb-4">
                  {/* Team 1 */}
                  <div className="flex items-center justify-between bg-white rounded sm:p-2 p-1.5">
                    <span className={`sm:text-sm text-xs font-medium truncate ${
                      match.winner?.id === match.team1?.id ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {match.team1?.name || 'TBD'}
                      {match.winner?.id === match.team1?.id && ' 🏆'}
                    </span>
                    <span className="sm:text-lg text-base font-bold text-gray-900 ml-2">
                      {match.score1 ?? '-'}
                    </span>
                  </div>
                  
                  {/* VS Divider */}
                  <div className="text-center sm:text-xs text-[10px] text-gray-400 font-medium">
                    VS
                  </div>
                  
                  {/* Team 2 */}
                  <div className="flex items-center justify-between bg-white rounded sm:p-2 p-1.5">
                    <span className={`sm:text-sm text-xs font-medium truncate ${
                      match.winner?.id === match.team2?.id ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {match.team2?.name || 'TBD'}
                      {match.winner?.id === match.team2?.id && ' 🏆'}
                    </span>
                    <span className="sm:text-lg text-base font-bold text-gray-900 ml-2">
                      {match.score2 ?? '-'}
                    </span>
                  </div>
                </div>

                {/* Score Edit Section */}
                {match.team1 && match.team2 && (
                  <div>
                    {editingMatch === match.id ? (
                      <div className="space-y-2">
                        <div className="flex gap-2 justify-center">
                          <input
                            type="number"
                            value={editingScore1}
                            onChange={(e) => setEditingScore1(e.target.value)}
                            className="w-12 sm:px-2 sm:py-1 px-1 py-0.5 border border-gray-300 rounded text-center sm:text-sm text-xs"
                            placeholder="0"
                            min="0"
                          />
                          <span className="sm:text-sm text-xs text-gray-500 leading-6">:</span>
                          <input
                            type="number"
                            value={editingScore2}
                            onChange={(e) => setEditingScore2(e.target.value)}
                            className="w-12 sm:px-2 sm:py-1 px-1 py-0.5 border border-gray-300 rounded text-center sm:text-sm text-xs"
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={handleMatchSave}
                            className="flex-1 sm:px-2 sm:py-1 px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors sm:text-xs text-[10px]"
                          >
                            저장
                          </button>
                          <button
                            onClick={handleMatchCancel}
                            className="flex-1 sm:px-2 sm:py-1 px-1.5 py-0.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors sm:text-xs text-[10px]"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleMatchEdit(match)}
                        className="w-full sm:px-3 sm:py-2 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors sm:text-sm text-xs"
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

        {/* Bulk Team Input Modal */}
        {showBulkInput && isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center sm:p-4 p-2 z-50">
            <div className="bg-white rounded-lg sm:p-6 p-4 w-full max-w-md">
              <h3 className="sm:text-lg text-base font-bold mb-4">팀명 일괄 입력</h3>
              <textarea
                value={bulkTeamNames}
                onChange={(e) => setBulkTeamNames(e.target.value)}
                className="w-full sm:h-40 h-32 sm:p-3 p-2 border border-gray-300 rounded-lg resize-none sm:text-sm text-xs"
                placeholder="Team 1&#10;Team 2&#10;Team 3&#10;...&#10;&#10;쉼표나 줄바꿈으로 구분해주세요"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowBulkInput(false)}
                  className="flex-1 sm:px-4 sm:py-2 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors sm:text-sm text-xs"
                >
                  취소
                </button>
                <button
                  onClick={handleBulkTeamInput}
                  className="flex-1 sm:px-4 sm:py-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors sm:text-sm text-xs"
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualifierBracket;
