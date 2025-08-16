import React, { useState } from 'react';
import { ArrowLeft, Edit3, Trophy, Users, Calendar } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import type { Match, Team } from '../types/tournament';

interface TournamentBracketProps {
  onBack: () => void;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ onBack }) => {
  const { currentTournament, updateTeamName, updateMatchScore } = useTournament();
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [scoreInputs, setScoreInputs] = useState<{score1: string; score2: string}>({score1: '', score2: ''});

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 
                     font-medium transition-colors duration-200"
          >
            <ArrowLeft size={20} />
            대시보드로 돌아가기
          </button>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="text-yellow-500" size={32} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{currentTournament.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Users size={16} />
                      {currentTournament.teamCount}팀
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(currentTournament.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">진행률</div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    (currentTournament.matches.filter(m => m.winner).length / currentTournament.matches.length) * 100
                  )}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teams Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">참가 팀</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {currentTournament.teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                {editingTeam === team.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
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
                    <span className="text-sm font-medium text-gray-800">{team.name}</span>
                    <Edit3 className="text-gray-400 group-hover:text-blue-600 transition-colors" size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bracket */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">대진표</h2>
          
          <div className="overflow-x-auto">
            <div className="flex gap-8 min-w-max">
              {Object.entries(roundMatches)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([round, matches]) => (
                <div key={round} className="flex flex-col">
                  <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">
                    {getRoundName(parseInt(round), totalRounds)}
                  </h3>
                  
                  <div className="space-y-6">
                    {matches
                      .sort((a, b) => a.matchIndex - b.matchIndex)
                      .map((match) => (
                      <div key={match.id} className="bg-gray-50 rounded-lg p-4 min-w-[250px]">
                        {/* Team 1 */}
                        <div className={`flex items-center justify-between p-3 rounded-lg mb-2 ${
                          match.winner?.id === match.team1?.id ? 'bg-green-100 border-2 border-green-500' : 'bg-white border-2 border-gray-200'
                        }`}>
                          <span className="font-medium text-gray-800">
                            {match.team1?.name || 'TBD'}
                          </span>
                          <span className="text-lg font-bold text-gray-700">
                            {match.score1 ?? '-'}
                          </span>
                        </div>
                        
                        {/* VS */}
                        <div className="text-center text-gray-500 text-sm font-medium mb-2">VS</div>
                        
                        {/* Team 2 */}
                        <div className={`flex items-center justify-between p-3 rounded-lg mb-3 ${
                          match.winner?.id === match.team2?.id ? 'bg-green-100 border-2 border-green-500' : 'bg-white border-2 border-gray-200'
                        }`}>
                          <span className="font-medium text-gray-800">
                            {match.team2?.name || 'TBD'}
                          </span>
                          <span className="text-lg font-bold text-gray-700">
                            {match.score2 ?? '-'}
                          </span>
                        </div>
                        
                        {/* Edit Score Button */}
                        {match.team1 && match.team2 && (
                          <div className="text-center">
                            {editingMatch === match.id ? (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    placeholder="점수1"
                                    value={scoreInputs.score1}
                                    onChange={(e) => setScoreInputs(prev => ({...prev, score1: e.target.value}))}
                                    className="flex-1 px-2 py-1 border rounded text-sm"
                                    min="0"
                                  />
                                  <input
                                    type="number"
                                    placeholder="점수2"
                                    value={scoreInputs.score2}
                                    onChange={(e) => setScoreInputs(prev => ({...prev, score2: e.target.value}))}
                                    className="flex-1 px-2 py-1 border rounded text-sm"
                                    min="0"
                                  />
                                </div>
                                <button
                                  onClick={handleMatchSave}
                                  className="w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                >
                                  저장
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleMatchEdit(match)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
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
      </div>
    </div>
  );
};

export default TournamentBracket;
