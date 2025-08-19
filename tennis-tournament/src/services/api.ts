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

  // Qualifier socket event listeners
  onQualifierCreated(callback: (qualifier: any) => void) {
    this.socket.on('qualifier_created', callback);
  }

  onQualifierDeleted(callback: (data: { id: string }) => void) {
    this.socket.on('qualifier_deleted', callback);
  }

  onQualifierTeamUpdated(callback: (data: { id: string; name: string }) => void) {
    this.socket.on('qualifier_team_updated', callback);
  }

  onQualifierMatchUpdated(callback: (data: any) => void) {
    this.socket.on('qualifier_match_updated', callback);
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

  // Qualifier API calls
  async getQualifiers(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/qualifiers`);
    if (!response.ok) {
      throw new Error('Failed to fetch qualifiers');
    }
    return response.json();
  }

  async getQualifier(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/qualifiers/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch qualifier');
    }
    return response.json();
  }

  async createQualifier(name: string, teamCount: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/qualifiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, teamCount }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create qualifier');
    }
    return response.json();
  }

  async deleteQualifier(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/qualifiers/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete qualifier');
    }
  }

  // Qualifier team API calls
  async updateQualifierTeamName(teamId: string, name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/qualifier-teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update qualifier team name');
    }
  }

  // Qualifier match API calls
  async updateQualifierMatchScore(
    matchId: string, 
    score1: number, 
    score2: number, 
    winnerId: string, 
    qualifierId: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/qualifier-matches/${matchId}/score`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score1, score2, winnerId, qualifierId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update qualifier match score');
    }
  }

  // Export qualifier results as Excel
  async exportQualifierResults(qualifierId: string, qualifierName: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/qualifiers/${qualifierId}/export`);
      
      if (!response.ok) {
        throw new Error('Failed to export qualifier results');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${qualifierName}_예선전_결과.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  // Export tournament results as Excel
  async exportTournamentResults(tournamentId: string, tournamentName: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/export`);
      
      if (!response.ok) {
        throw new Error('Failed to export tournament results');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tournamentName}_토너먼트_결과.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Tournament export error:', error);
      throw error;
    }
  }

  // Export qualifier results as PDF
  async exportQualifierResultsPDF(qualifierId: string, qualifierName: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/qualifiers/${qualifierId}/export-pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to export qualifier PDF');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${qualifierName}_예선전_결과.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  }

  // Export tournament results as PDF
  async exportTournamentResultsPDF(tournamentId: string, tournamentName: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/export-pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to export tournament PDF');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tournamentName}_토너먼트_결과.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Tournament PDF export error:', error);
      throw error;
    }
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export const apiService = new ApiService();
