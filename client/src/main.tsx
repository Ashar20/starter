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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StarknetProvider>
      <DenshokanProvider config={{ chain: 'sepolia' }}>
        <App />
      </DenshokanProvider>
    </StarknetProvider>
  </StrictMode>
);
