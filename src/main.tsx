import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import EWalletAgentPage from './pages/EWalletAgentPage.tsx';
import './index.css';
import { I18nProvider } from './lib/i18n.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/agent" element={<EWalletAgentPage />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
);
