import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Marketplace from './pages/Marketplace';
import Library from './pages/Library';
import SharedNotebook from './pages/SharedNotebook';
import Settings from './pages/Settings';
import Layout from './layouts/Layout';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/library" element={<Library />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      {/* Workspace view - standalone layout for maximum space */}
      <Route path="/workspace/:id?" element={<Workspace />} />
      {/* Shared notebook view - outside of main layout for clean viewing */}
      <Route path="/shared/:id" element={<SharedNotebook />} />
    </Routes>
  );
}

export default App;
