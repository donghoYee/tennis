import React, { useState } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { QualifierProvider, useQualifier } from './context/QualifierContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import CreateTournamentForm from './components/CreateTournamentForm';
import CreateQualifierForm from './components/CreateQualifierForm';
import TournamentBracket from './components/TournamentBracket';
import QualifierBracket from './components/QualifierBracket';
import LoadingScreen from './components/LoadingScreen';

type AppView = 'dashboard' | 'createTournament' | 'createQualifier' | 'tournament' | 'qualifier';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const { currentTournament, isCreatingTournament, clearCurrentTournament } = useTournament();
  const { currentQualifier, isCreatingQualifier, clearCurrentQualifier } = useQualifier();
  const { isAdmin } = useAuth();

  // Auto-navigate to tournament view when a tournament is selected
  React.useEffect(() => {
    if (currentTournament && currentView !== 'tournament') {
      setCurrentView('tournament');
    }
  }, [currentTournament, currentView]);

  // Auto-navigate to qualifier view when a qualifier is selected
  React.useEffect(() => {
    if (currentQualifier && currentView !== 'qualifier') {
      setCurrentView('qualifier');
    }
  }, [currentQualifier, currentView]);

  const handleCreateTournament = () => {
    if (isAdmin) {
      setCurrentView('createTournament');
    }
  };

  const handleCreateQualifier = () => {
    if (isAdmin) {
      setCurrentView('createQualifier');
    }
  };

  const handleBackToDashboard = () => {
    clearCurrentTournament(); // Clear current tournament first
    clearCurrentQualifier(); // Clear current qualifier first
    setCurrentView('dashboard');
  };

  // Show loading screen when creating tournament or qualifier
  if (isCreatingTournament) {
    return <LoadingScreen message="대회를 생성하고 있습니다..." />;
  }

  if (isCreatingQualifier) {
    return <LoadingScreen message="예선전을 생성하고 있습니다..." />;
  }

  switch (currentView) {
    case 'createTournament':
      return isAdmin ? <CreateTournamentForm onBack={handleBackToDashboard} /> : <Dashboard onCreateTournament={handleCreateTournament} onCreateQualifier={handleCreateQualifier} />;
    case 'createQualifier':
      return isAdmin ? <CreateQualifierForm onBack={handleBackToDashboard} /> : <Dashboard onCreateTournament={handleCreateTournament} onCreateQualifier={handleCreateQualifier} />;
    case 'tournament':
      return <TournamentBracket onBack={handleBackToDashboard} />;
    case 'qualifier':
      return <QualifierBracket onBack={handleBackToDashboard} />;
    default:
      return <Dashboard onCreateTournament={handleCreateTournament} onCreateQualifier={handleCreateQualifier} />;
  }
};

function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <QualifierProvider>
          <AppContent />
        </QualifierProvider>
      </TournamentProvider>
    </AuthProvider>
  );
}

export default App;
