'use client';

import { getDefaultConfig, TantoProvider } from '@sky-mavis/tanto-widget';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ronin, saigon } from 'viem/chains';

const config = getDefaultConfig({
    appMetadata: {
      appName: 'Helpify',
      appIcon: 'https://via.placeholder.com/256x256?text=WSY',
      appDescription: 'A decentralized crowdfunding platform on Ronin',
      appUrl: 'https://Helpify.com',
    },
    keylessWalletConfig: {
      chainId: 2021, // Saigon Testnet
      enable: false,
      clientId: 'disabled',
    },
    walletConnectConfig: {
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'disabled',
    },
    coinbaseWalletConfig: {
      enable: true,
    },
    chains: [ronin, saigon],
  });

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TantoProvider theme="dark">
          {children}
        </TantoProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 