import React from 'react';
import ReactDOM from 'react-dom/client';
import type { HubConnection } from '@microsoft/signalr';
import App from '../../frontend/dashboard/src/App';
import '../../frontend/dashboard/src/index.css';
import { mockApi } from './mockApi';

const demoConnection = {
  on: () => undefined,
  off: () => undefined,
  start: () => Promise.resolve(),
  stop: () => Promise.resolve()
} as unknown as HubConnection;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App connection={demoConnection} apiClient={mockApi} autoSignIn />
  </React.StrictMode>
);
