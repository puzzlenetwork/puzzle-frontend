import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import WalletAuth from "@components/WalletAuth";
import ThemeWrapper from "@themes/ThemeProvider";

import { RootStore, storesContext } from "@stores";

import { wagmiConfig } from "@constants/wagmiConfig";
import { loadState } from "@utils/localStorage";

import "@themes/fonts";

import GlobalStyles from "./themes/GlobalStyles";
import App from "./App";

import "react-toastify/dist/ReactToastify.css";
import "rc-dialog/assets/index.css";
import "./index.css";
import "normalize.css";

const initState = loadState();

const STORE = RootStore.create(initState);

console.warn(`Version: ${process.env.__COMMIT_HASH__}`);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

const RainbowKitTheme = darkTheme({
  accentColor: "linear-gradient(114deg, #E478FE 17.57%, #9A45FE 81.44%)",
  accentColorForeground: "white",
  borderRadius: "large",
  fontStack: "system",
});

root.render(
  // <React.StrictMode>
  <storesContext.Provider value={STORE}>
    <ThemeWrapper>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            initialChain={wagmiConfig.chains[0]}
            locale="en"
            modalSize="compact"
            theme={RainbowKitTheme}
          >
            <BrowserRouter>
              <App />
              <WalletAuth />
            </BrowserRouter>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
      <ToastContainer />
      <GlobalStyles />
    </ThemeWrapper>
  </storesContext.Provider>,
  // </React.StrictMode>,
);
