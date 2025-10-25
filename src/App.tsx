import { useState } from 'react';
import Dashboard from './components/Dashboard';
import OrganizationManager from './components/OrganizationManager';
import GapAnalysis from './components/GapAnalysis';
import MapView from './components/MapView';
import './App.css';

type View = 'dashboard' | 'organizations' | 'gaps' | 'map';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>NYC Ecosystem Gap Finder</h1>
          <p className="tagline">Mapping faith and community resources across the 5 boroughs</p>
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
    </div>
  );
}

export default App;
