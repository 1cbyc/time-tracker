import React from 'react';
import { createRoot } from 'react-dom/client';

import dotenv from 'dotenv';

import App from './App';
import { initSentry } from './shared/initSentry';
import './services/gaService/GaService';

dotenv.config();

initSentry();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);
