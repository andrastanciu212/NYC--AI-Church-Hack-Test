import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import OrganizationManager from './components/OrganizationManager';
import GapAnalysis from './components/GapAnalysis';
import MapView from './components/MapView';
import ProfileForm from './components/ProfileForm';
import './App.css';

type View = 'dashboard' | 'organizations' | 'gaps' | 'map';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>See New York</h1>
          <p className="tagline">Mapping community resources across the 5 boroughs</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowProfileForm(true)} className="profile-button">
            Profile
          </button>
          <button onClick={signOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
      </header>

      <nav className="nav">
        <button
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => setCurrentView('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={currentView === 'map' ? 'active' : ''}
          onClick={() => setCurrentView('map')}
        >
          Map
        </button>
        <button
          className={currentView === 'organizations' ? 'active' : ''}
          onClick={() => setCurrentView('organizations')}
        >
          Organizations
        </button>
        <button
          className={currentView === 'gaps' ? 'active' : ''}
          onClick={() => setCurrentView('gaps')}
        >
          Gap Analysis
        </button>
      </nav>

      <main className="main">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'map' && <MapView />}
        {currentView === 'organizations' && <OrganizationManager />}
        {currentView === 'gaps' && <GapAnalysis />}
      </main>

      {showProfileForm && (
        <ProfileForm
          onClose={() => setShowProfileForm(false)}
          onSave={() => setShowProfileForm(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
