/**
 * Starknet wallet hook — wraps @starknet-react/core for Contagion.
 * No Stellar. Uses Starknet address as player ID.
 */
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import type { Connector } from '@starknet-react/core';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const publicKey = address ?? null;
  const walletType = 'starknet' as const;

  const connectWallet = async () => {
    if (connectors[0]) {
      await connect({ connector: connectors[0] });
    }
  };

  return {
    publicKey,
    isConnected: !!isConnected,
    connectWallet,
    disconnect,
    connectors,
    getContractSigner: () => null, // No Stellar signer; on-chain proof submission disabled
    walletType,
  };
}
