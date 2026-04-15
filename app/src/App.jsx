import { useState } from 'react';
import Dashboard    from './components/Dashboard';
import MapSimulator from './components/MapSimulator';

export default function App() {
  const [view, setView] = useState('dashboard');

  return view === 'dashboard'
    ? <Dashboard    onOpenSimulator={() => setView('simulator')} />
    : <MapSimulator onBack={()        => setView('dashboard')} />;
}
