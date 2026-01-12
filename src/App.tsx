import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/MainLayout';
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import ConfigPage from './pages/ConfigPage';
import TriggerPage from './pages/TriggerPage';
import CookiePage from './pages/CookiePage';
import OpinionReportPage from './pages/OpinionReportPage';
import DataPage from './pages/DataPage';
import DataTransformPage from './pages/DataTransformPage';
import AnnotationEditorPage from './pages/AnnotationEditorPage';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
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
            <Route path="opinion-report" element={<OpinionReportPage />} />
            <Route path="data" element={<DataPage />} />
            <Route path="data-transform" element={<DataTransformPage />} />
            <Route path="annotation-editor" element={<AnnotationEditorPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
