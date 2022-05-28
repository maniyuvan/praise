import React from 'react';
import ReactDOM from 'react-dom';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import RecoilNexus from 'recoil-nexus';
import { useErrorBoundary } from 'use-error-boundary';
import '@rainbow-me/rainbowkit/styles.css';
import {
  Chain,
  connectorsForWallets,
  wallet,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import Routes from './navigation/Routes';
import ErrorPage from './pages/ErrorPage';
import LoadScreen from '@/components/LoadScreen';
import './styles/globals.css';

const LOAD_DELAY = 500;

const gnosisChain: Chain = {
  id: 100,
  name: 'Gnosis Chain',
  network: 'Gnosis Chain',
  iconUrl: `${process.env.REACT_APP_SERVER_URL}/uploads/gnosischain_logo.png`,
  nativeCurrency: {
    decimals: 18,
    name: 'xDAI',
    symbol: 'xDAI',
  },
  rpcUrls: {
    default: 'https://rpc.gnosischain.com',
  },
  blockExplorers: {
    default: {
      name: 'BlockScout',
      url: 'https://blockscout.com/xdai/mainnet/',
    },
    blockscout: {
      name: 'BlockScout',
      url: 'https://blockscout.com/xdai/mainnet/',
    },
  },
  testnet: false,
};

const { chains, provider } = configureChains([gnosisChain], [publicProvider()]);

const needsInjectedWalletFallback =
  typeof window !== 'undefined' &&
  window.ethereum &&
  !window.ethereum.isMetaMask &&
  !window.ethereum.isCoinbaseWallet;

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      wallet.metaMask({ chains }),
      wallet.ledger({ chains }),
      wallet.coinbase({ appName: 'Praise', chains }),
      wallet.walletConnect({ chains }),
      wallet.trust({ chains }),
      wallet.rainbow({ chains }),
      ...(needsInjectedWalletFallback ? [wallet.injected({ chains })] : []),
    ],
  },
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

interface DelayedLoadingProps {
  children: JSX.Element;
}
const DelayedLoading = ({
  children,
}: DelayedLoadingProps): JSX.Element | null => {
  const [delay, setDelay] = React.useState<boolean>(true);

  React.useEffect(() => {
    setTimeout(() => {
      setDelay(false);
    }, LOAD_DELAY);
  }, []);

  // Possibility to add loader here
  if (delay) return null;
  return children;
};

interface ErrorBoundaryProps {
  children: JSX.Element;
}
const ErrorBoundary = ({ children }: ErrorBoundaryProps): JSX.Element => {
  const { ErrorBoundary } = useErrorBoundary();

  return (
    <ErrorBoundary
      render={(): JSX.Element => children}
      renderError={({ error }): JSX.Element => <ErrorPage error={error} />}
    />
  );
};

ReactDOM.render(
  <React.StrictMode>
    <RecoilRoot>
      <RecoilNexus />
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <Router>
            <main>
              <DelayedLoading>
                <React.Suspense fallback={<LoadScreen />}>
                  <ErrorBoundary>
                    <Routes />
                  </ErrorBoundary>
                </React.Suspense>
              </DelayedLoading>
              <Toaster
                position="bottom-right"
                reverseOrder={false}
                toastOptions={{ duration: 3000 }}
              />
            </main>
          </Router>
        </RainbowKitProvider>
      </WagmiConfig>
    </RecoilRoot>
  </React.StrictMode>,

  document.getElementById('root')
);
