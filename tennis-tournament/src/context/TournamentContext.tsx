import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Tournament, TournamentContextType } from '../types/tournament';
import { apiService } from '../services/api';

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};

interface TournamentProviderProps {
  children: ReactNode;
}

export const TournamentProvider: React.FC<TournamentProviderProps> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);

  // Load tournaments from API on mount
  useEffect(() => {
    loadTournaments();
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    apiService.onTournamentCreated((tournament) => {
      console.log('Tournament created:', tournament);
      loadTournaments(); // Refresh tournaments list
    });

    apiService.onTournamentDeleted((data) => {
      console.log('Tournament deleted:', data);
      setTournaments(prev => prev.filter(t => t.id !== data.id));
      if (currentTournament?.id === data.id) {
        setCurrentTournament(null);
      }
    });

    apiService.onTeamUpdated((data) => {
      console.log('Team updated:', data);
      if (currentTournament) {
        loadCurrentTournament(currentTournament.id);
      }
    });

    apiService.onMatchUpdated((data) => {
      console.log('Match updated:', data);
      if (currentTournament) {
        loadCurrentTournament(currentTournament.id);
      }
    });

    return () => {
      apiService.removeAllListeners();
    };
  }, [currentTournament]);

  const loadTournaments = async () => {
    try {
      const apiTournaments = await apiService.getTournaments();
      
      // Convert API response to Tournament format
      const formattedTournaments: Tournament[] = apiTournaments.map(t => ({
        id: t.id,
        name: t.name,
        teamCount: t.team_count,
        teams: [],
        matches: [],
        isActive: Boolean(t.is_active),
        createdAt: t.created_at,
        total_matches: t.total_matches,
        completed_matches: t.completed_matches
      }));
      
      setTournaments(formattedTournaments);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    }
  };

  const loadCurrentTournament = async (tournamentId: string) => {
    try {
      const apiTournament = await apiService.getTournament(tournamentId);
      
      // Convert API response to Tournament format
      const formattedTournament: Tournament = {
        id: apiTournament.id,
        name: apiTournament.name,
        teamCount: apiTournament.team_count,
        teams: apiTournament.teams
          .map((t: any) => ({
            id: t.id,
            name: t.name,
            position: t.position || 0
          }))
          .sort((a: { id: string; name: string; position: number }, b: { id: string; name: string; position: number }) => {
            // Sort by position first, then by team number extracted from ID
            if (a.position !== b.position) {
              return a.position - b.position;
            }
            
            // Extract team number from ID (e.g., "team-1-tournament-123" -> 1)
            const getTeamNumber = (id: string): number => {
              const match = id.match(/team-(\d+)-/);
              return match ? parseInt(match[1], 10) : 0;
            };
            
            return getTeamNumber(a.id) - getTeamNumber(b.id);
          }),
        matches: apiTournament.matches.map((m: any) => ({
          id: m.id,
          team1: m.team1_id ? {
            id: m.team1_id,
            name: m.team1_name || 'TBD'
          } : null,
          team2: m.team2_id ? {
            id: m.team2_id,
            name: m.team2_name || 'TBD'
          } : null,
          score1: m.score1,
          score2: m.score2,
          winner: m.winner_id ? {
            id: m.winner_id,
            name: m.winner_name || 'Winner'
          } : null,
          round: m.round,
          matchIndex: m.match_index
        })),
        isActive: Boolean(apiTournament.is_active),
        createdAt: apiTournament.created_at
      };
      
      setCurrentTournament(formattedTournament);
      apiService.joinTournament(tournamentId);
    } catch (error) {
      console.error('Failed to load tournament:', error);
    }
  };

  const createTournament = async (name: string, teamCount: number) => {
    try {
      setIsCreatingTournament(true);
      const newTournament = await apiService.createTournament(name, teamCount);
      await loadTournaments();
      
      // Load and select the new tournament
      await loadCurrentTournament(newTournament.id);
    } catch (error) {
      console.error('Failed to create tournament:', error);
    } finally {
      setIsCreatingTournament(false);
    }
  };

  const selectTournament = async (tournament: Tournament) => {
    await loadCurrentTournament(tournament.id);
  };

  const clearCurrentTournament = () => {
    setCurrentTournament(null);
  };

  const updateTeamName = async (teamId: string, name: string) => {
    try {
      await apiService.updateTeamName(teamId, name);
      
      // Immediately reload current tournament to show updates
      if (currentTournament) {
        await loadCurrentTournament(currentTournament.id);
      }
    } catch (error) {
      console.error('Failed to update team name:', error);
    }
  };

  const updateMatchScore = async (matchId: string, score1: number, score2: number) => {
    if (!currentTournament) return;

    try {
      const match = currentTournament.matches.find(m => m.id === matchId);
      if (!match || !match.team1 || !match.team2) return;

      const winnerId = score1 > score2 ? match.team1.id : match.team2.id;
      
      await apiService.updateMatchScore(
        matchId, 
        score1, 
        score2, 
        winnerId, 
        currentTournament.id
      );
      
      // Immediately reload current tournament to show updates
      await loadCurrentTournament(currentTournament.id);
    } catch (error) {
      console.error('Failed to update match score:', error);
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      await apiService.deleteTournament(tournamentId);
      
      // Immediately update tournaments list
      await loadTournaments();
      
      // If we're currently viewing the deleted tournament, go back to dashboard
      if (currentTournament?.id === tournamentId) {
        setCurrentTournament(null);
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      apiService.disconnect();
    };
  }, []);

  const contextValue: TournamentContextType = {
    tournaments,
    currentTournament,
    isCreatingTournament,
    createTournament,
    selectTournament,
    clearCurrentTournament,
    updateTeamName,
    updateMatchScore,
    deleteTournament
  };

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
};
