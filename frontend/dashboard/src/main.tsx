import React from 'react';
import ReactDOM from 'react-dom/client';
import { HubConnectionBuilder } from '@microsoft/signalr';
import App from './App';
import { API_BASE_URL } from './api';
import './index.css';

const connection = new HubConnectionBuilder()
  .withUrl(`${API_BASE_URL}/hubs/price-updates`)
  .withAutomaticReconnect()
  .build();

connection.start().catch(() => undefined);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App connection={connection} />
  </React.StrictMode>
);
