import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';
import type { Qualifier, QualifierContextType, QualifierTeam, QualifierMatch } from '../types/tournament';

const QualifierContext = createContext<QualifierContextType | undefined>(undefined);

export const QualifierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [qualifiers, setQualifiers] = useState<Qualifier[]>([]);
  const [currentQualifier, setCurrentQualifier] = useState<Qualifier | null>(null);
  const [isCreatingQualifier, setIsCreatingQualifier] = useState(false);

  // Data transformation helpers
  const transformQualifierTeam = (team: any): QualifierTeam => ({
    id: team.id,
    name: team.name,
    position: team.position
  });

  const transformQualifierMatch = (match: any): QualifierMatch => ({
    id: match.id,
    team1: match.team1_name ? { 
      id: match.team1_id, 
      name: match.team1_name,
      position: 0
    } : null,
    team2: match.team2_name ? { 
      id: match.team2_id, 
      name: match.team2_name,
      position: 0
    } : null,
    score1: match.score1,
    score2: match.score2,
    winner: match.winner_name ? { 
      id: match.winner_id, 
      name: match.winner_name,
      position: 0
    } : null,
    matchIndex: match.match_index
  });

  const transformQualifier = (qualifier: any): Qualifier => ({
    id: qualifier.id,
    name: qualifier.name,
    teamCount: qualifier.team_count || qualifier.teamCount,
    teams: (qualifier.teams || []).map(transformQualifierTeam),
    matches: (qualifier.matches || []).map(transformQualifierMatch),
    isActive: qualifier.is_active !== undefined ? qualifier.is_active : true,
    createdAt: qualifier.created_at || qualifier.createdAt || new Date().toISOString(),
    total_matches: qualifier.total_matches,
    completed_matches: qualifier.completed_matches
  });

  // Load qualifiers on mount
  useEffect(() => {
    loadQualifiers();
  }, []);

  // Socket event listeners
  useEffect(() => {
    apiService.onQualifierCreated((qualifier) => {
      setQualifiers(prev => [transformQualifier(qualifier), ...prev]);
    });

    apiService.onQualifierDeleted((data) => {
      setQualifiers(prev => prev.filter(q => q.id !== data.id));
      if (currentQualifier?.id === data.id) {
        setCurrentQualifier(null);
      }
    });

    apiService.onQualifierTeamUpdated((data) => {
      if (currentQualifier) {
        setCurrentQualifier(prev => {
          if (!prev) return null;
          return {
            ...prev,
            teams: prev.teams.map(team => 
              team.id === data.id ? { ...team, name: data.name } : team
            ),
            matches: prev.matches.map(match => ({
              ...match,
              team1: match.team1?.id === data.id ? { ...match.team1, name: data.name } : match.team1,
              team2: match.team2?.id === data.id ? { ...match.team2, name: data.name } : match.team2,
              winner: match.winner?.id === data.id ? { ...match.winner, name: data.name } : match.winner
            }))
          };
        });
      }
    });

    apiService.onQualifierMatchUpdated((data) => {
      if (currentQualifier && currentQualifier.id === data.qualifierId) {
        loadQualifier(currentQualifier.id);
      }
    });

    return () => {
      apiService.removeAllListeners();
    };
  }, [currentQualifier]);

  const loadQualifiers = async () => {
    try {
      const data = await apiService.getQualifiers();
      setQualifiers(data.map(transformQualifier));
    } catch (error) {
      console.error('Failed to load qualifiers:', error);
    }
  };

  const loadQualifier = async (qualifierId: string) => {
    try {
      const data = await apiService.getQualifier(qualifierId);
      const transformedQualifier = transformQualifier(data);
      
      // Sort teams by position
      transformedQualifier.teams.sort((a: QualifierTeam, b: QualifierTeam) => {
        // First sort by position if available
        if (a.position && b.position) {
          return a.position - b.position;
        }
        
        // Fallback to extracting number from team ID/name
        const getTeamNumber = (team: QualifierTeam): number => {
          const match = team.id.match(/qteam-(\d+)-/) || team.name.match(/Team (\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        
        return getTeamNumber(a) - getTeamNumber(b);
      });
      
      setCurrentQualifier(transformedQualifier);
    } catch (error) {
      console.error('Failed to load qualifier:', error);
    }
  };

  const createQualifier = async (name: string, teamCount: number) => {
    setIsCreatingQualifier(true);
    try {
      const response = await apiService.createQualifier(name, teamCount);
      const newQualifier = transformQualifier(response);
      setCurrentQualifier(newQualifier);
    } catch (error) {
      console.error('Failed to create qualifier:', error);
    } finally {
      setIsCreatingQualifier(false);
    }
  };

  const selectQualifier = (qualifier: Qualifier) => {
    setCurrentQualifier(qualifier);
    loadQualifier(qualifier.id);
    apiService.joinTournament(qualifier.id); // Reuse tournament join for socket rooms
  };

  const clearCurrentQualifier = () => {
    setCurrentQualifier(null);
  };

  const updateQualifierTeamName = async (teamId: string, name: string) => {
    try {
      await apiService.updateQualifierTeamName(teamId, name);
    } catch (error) {
      console.error('Failed to update qualifier team name:', error);
    }
  };

  const updateQualifierMatchScore = async (matchId: string, score1: number, score2: number) => {
    if (!currentQualifier) return;

    try {
      const match = currentQualifier.matches.find(m => m.id === matchId);
      if (!match || !match.team1 || !match.team2) return;

      const winnerId = score1 > score2 ? match.team1.id : match.team2.id;
      await apiService.updateQualifierMatchScore(matchId, score1, score2, winnerId, currentQualifier.id);
    } catch (error) {
      console.error('Failed to update qualifier match score:', error);
    }
  };

  const deleteQualifier = async (qualifierId: string) => {
    try {
      await apiService.deleteQualifier(qualifierId);
    } catch (error) {
      console.error('Failed to delete qualifier:', error);
    }
  };

  const value: QualifierContextType = {
    qualifiers,
    currentQualifier,
    isCreatingQualifier,
    createQualifier,
    selectQualifier,
    clearCurrentQualifier,
    updateQualifierTeamName,
    updateQualifierMatchScore,
    deleteQualifier
  };

  return (
    <QualifierContext.Provider value={value}>
      {children}
    </QualifierContext.Provider>
  );
};

export const useQualifier = () => {
  const context = useContext(QualifierContext);
  if (context === undefined) {
    throw new Error('useQualifier must be used within a QualifierProvider');
  }
  return context;
};
