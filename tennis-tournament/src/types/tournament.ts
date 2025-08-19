export interface Team {
  id: string;
  name: string;
  position?: number;
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

// Qualifier types
export interface QualifierTeam {
  id: string;
  name: string;
  position?: number;
}

export interface QualifierMatch {
  id: string;
  team1: QualifierTeam | null;
  team2: QualifierTeam | null;
  score1: number | null;
  score2: number | null;
  winner: QualifierTeam | null;
  matchIndex: number;
}

export interface Qualifier {
  id: string;
  name: string;
  teamCount: number;
  teams: QualifierTeam[];
  matches: QualifierMatch[];
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

export interface QualifierContextType {
  qualifiers: Qualifier[];
  currentQualifier: Qualifier | null;
  isCreatingQualifier: boolean;
  createQualifier: (name: string, teamCount: number) => void;
  selectQualifier: (qualifier: Qualifier) => void;
  clearCurrentQualifier: () => void;
  updateQualifierTeamName: (teamId: string, name: string) => void;
  updateQualifierMatchScore: (matchId: string, score1: number, score2: number) => void;
  deleteQualifier: (qualifierId: string) => void;
}