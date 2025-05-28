import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Sessions from './pages/Sessions';
import Components from './pages/Components';
import { PowerDataProvider } from './context/PowerDataContext';

function App() {
  return (
    <PowerDataProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="components" element={<Components />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </PowerDataProvider>
  );
}

export default App;