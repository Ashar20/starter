/**
 * Contagion — Dojo Hackathon
 * Starknet wallet + WebSocket gameplay. EGS via denshokan-sdk.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DenshokanProvider } from '@provable-games/denshokan-sdk/react';
import StarknetProvider from './starknet';
import App from './App';
import './index.css';

// When using a remote backend (e.g. ngrok), point the SDK at the same host so it doesn't try localhost:3001
const wsUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_CONTAGION_WS_URL;
const denshokanApiUrl =
  wsUrl && /^wss?:\/\//.test(wsUrl)
    ? wsUrl.replace(/^wss?:\/\//, 'https://').replace(/\/$/, '')
    : undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StarknetProvider>
      <DenshokanProvider
        config={{
          chain: 'sepolia',
          ...(denshokanApiUrl && { apiUrl: denshokanApiUrl }),
        }}
      >
        <App />
      </DenshokanProvider>
    </StarknetProvider>
  </StrictMode>
);
