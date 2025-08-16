import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}`
  : 'http://localhost:3001/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL 
  ? import.meta.env.VITE_SOCKET_URL
  : 'http://localhost:3001';

class ApiService {
  private socket: Socket;

  constructor() {
    this.socket = io(SOCKET_URL);
  }

  // Socket event listeners
  onTournamentCreated(callback: (tournament: any) => void) {
    this.socket.on('tournament_created', callback);
  }

  onTournamentDeleted(callback: (data: { id: string }) => void) {
    this.socket.on('tournament_deleted', callback);
  }

  onTeamUpdated(callback: (data: { id: string; name: string }) => void) {
    this.socket.on('team_updated', callback);
  }

  onMatchUpdated(callback: (data: any) => void) {
    this.socket.on('match_updated', callback);
  }

  joinTournament(tournamentId: string) {
    this.socket.emit('join_tournament', tournamentId);
  }

  // Remove event listeners
  removeAllListeners() {
    this.socket.removeAllListeners();
  }

  // Tournament API calls
  async getTournaments(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/tournaments`);
    if (!response.ok) {
      throw new Error('Failed to fetch tournaments');
    }
    return response.json();
  }

  async getTournament(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tournaments/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch tournament');
    }
    return response.json();
  }

  async createTournament(name: string, teamCount: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tournaments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, teamCount }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create tournament');
    }
    return response.json();
  }

  async deleteTournament(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tournaments/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete tournament');
    }
  }

  // Team API calls
  async updateTeamName(teamId: string, name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update team name');
    }
  }

  // Match API calls
  async updateMatchScore(
    matchId: string, 
    score1: number, 
    score2: number, 
    winnerId: string, 
    tournamentId: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/matches/${matchId}/score`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score1, score2, winnerId, tournamentId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update match score');
    }
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export const apiService = new ApiService();
