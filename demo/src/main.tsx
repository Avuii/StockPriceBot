import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../frontend/dashboard/src/App';
import '../../frontend/dashboard/src/index.css';
import { mockApi } from './mockApi';

const demoConnection = {
  on: () => undefined,
  off: () => undefined
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App connection={demoConnection} apiClient={mockApi} autoSignIn />
  </React.StrictMode>
);
