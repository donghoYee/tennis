import React, { useState } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import CreateTournamentForm from './components/CreateTournamentForm';
import TournamentBracket from './components/TournamentBracket';
import LoadingScreen from './components/LoadingScreen';

type AppView = 'dashboard' | 'createTournament' | 'tournament';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const { currentTournament, isCreatingTournament, clearCurrentTournament } = useTournament();
  const { isAdmin } = useAuth();

  // Auto-navigate to tournament view when a tournament is selected
  React.useEffect(() => {
    if (currentTournament && currentView !== 'tournament') {
      setCurrentView('tournament');
    }
  }, [currentTournament, currentView]);

  const handleCreateTournament = () => {
    if (isAdmin) {
      setCurrentView('createTournament');
    }
  };

  const handleBackToDashboard = () => {
    clearCurrentTournament(); // Clear current tournament first
    setCurrentView('dashboard');
  };

  // Show loading screen when creating tournament
  if (isCreatingTournament) {
    return <LoadingScreen message="대회를 생성하고 있습니다..." />;
  }

  switch (currentView) {
    case 'createTournament':
      return isAdmin ? <CreateTournamentForm onBack={handleBackToDashboard} /> : <Dashboard onCreateTournament={handleCreateTournament} />;
    case 'tournament':
      return <TournamentBracket onBack={handleBackToDashboard} />;
    default:
      return <Dashboard onCreateTournament={handleCreateTournament} />;
  }
};

function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <AppContent />
      </TournamentProvider>
    </AuthProvider>
  );
}

export default App;
