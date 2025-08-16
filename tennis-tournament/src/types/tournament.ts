export interface Team {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  team1: Team | null;
  team2: Team | null;
  score1: number | null;
  score2: number | null;
  winner: Team | null;
  round: number;
  matchIndex: number;
}

export interface Tournament {
  id: string;
  name: string;
  teamCount: number;
  teams: Team[];
  matches: Match[];
  isActive: boolean;
  createdAt: string;
  // Optional fields from backend for dashboard display
  total_matches?: number;
  completed_matches?: number;
}

export interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isCreatingTournament: boolean;
  createTournament: (name: string, teamCount: number) => void;
  selectTournament: (tournament: Tournament) => void;
  clearCurrentTournament: () => void;
  updateTeamName: (teamId: string, name: string) => void;
  updateMatchScore: (matchId: string, score1: number, score2: number) => void;
  deleteTournament: (tournamentId: string) => void;
}