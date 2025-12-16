import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import ConfigPage from './pages/ConfigPage';
import TriggerPage from './pages/TriggerPage';
import CookiePage from './pages/CookiePage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/configs" replace />} />
          <Route path="configs" element={<ConfigPage />} />
          <Route path="trigger" element={<TriggerPage />} />
          <Route path="cookies" element={<CookiePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
