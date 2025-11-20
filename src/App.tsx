import React from "react";
import { Route, Routes } from "react-router-dom";
import styled from "@emotion/styled";
import { observer } from "mobx-react";

import { Column } from "@components/Flex";
import Header from "@components/Header";
import { PoolList } from "@components/PoolList/PoolList";

import { useClearUrlParam } from "@hooks/useClearUrlParam";

import { Footer } from "@screens/Footer";
import { PoolDetailsPage } from "@screens/PoolDetails";
import { SwapScreen } from "@screens/SwapScreen";

import "@rainbow-me/rainbowkit/styles.css";

const App: React.FC = observer(() => {
  // This hooks is used to clear unnecessary URL parameters,
  // specifically "tx_id", after returning from the faucet
  useClearUrlParam("tx_id");

  // usePrivateKeyAsAuth();

  return (
    <Root>
      <Header />
      <Routes>
        <Route element={<SwapScreen />} path="/" />
        <Route element={<PoolList />} path="/pools" />
        <Route element={<PoolDetailsPage />} path="/pool/:poolAddress" />
      </Routes>
      <Footer />
    </Root>
  );
});

export default App;

const Root = styled(Column)`
  width: 100%;
  align-items: center;
  min-width: 100vw;
  background: ${({ theme }) => theme.colors.bgPrimary};
  height: 100vh;
`;
