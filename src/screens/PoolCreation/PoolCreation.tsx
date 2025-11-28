import React from "react";

import Button from "@components/Button";
import { ConnectWalletButton } from "@components/ConnectWalletButton";
import Divider from "@components/Divider";
import { SmartFlex } from "@components/SmartFlex";
import Text from "@components/Text";

import { useWallet } from "@hooks/useWallet";

import { Token } from "@entity/Token";

import { ErrorContainer, Input, InputContainer, InputLabel, Root } from "./components/PoolCreationStyles";
import { TokenInput } from "./components/TokenInput";
import { usePoolCreation } from "./hooks/usePoolCreation";
import { usePoolForm } from "./hooks/usePoolForm";
import { useTokenManagement } from "./hooks/useTokenManagement";

const PoolCreation: React.FC = () => {
  const { wallet } = useWallet();

  // Use the custom hooks for form state and logic
  const [formState, formHandlers] = usePoolForm();
  const { createPool } = usePoolCreation();
  const { fetchTokenDetails, createTokenFromDetails } = useTokenManagement();

  const handleTokenChange = async (index: number, token: Token | null) => {
    // If the token is null or has all required details, set it directly
    if (!token || (token.name && token.symbol && token.decimals && token.address)) {
      formHandlers.handleTokenChange(index, token);
      return;
    }

    // If we have an address but missing details, fetch them from blockchain
    if (token?.address && (!token.name || !token.symbol || !token.decimals)) {
      const tokenDetails = await fetchTokenDetails(token.address);
      if (tokenDetails) {
        const newToken = createTokenFromDetails(tokenDetails);
        formHandlers.handleTokenChange(index, newToken);
        return;
      }
    }

    // If we couldn't fetch details, set the token as is
    formHandlers.handleTokenChange(index, token);
  };

  const handleCreatePool = async () => {
    await createPool(formState, wallet?.address, formHandlers.setIsLoading, formHandlers.setError);
  };

  return (
    <Root>
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <Text type="H">Create New Pool</Text>

        <InputContainer>
          <InputLabel>Pool Name</InputLabel>
          <Input
            placeholder="Enter pool name"
            value={formState.poolName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => formHandlers.setPoolName(e.target.value)}
          />
        </InputContainer>

        <InputContainer>
          <InputLabel>Pool Symbol</InputLabel>
          <Input
            placeholder="Enter pool symbol (e.g., MYPOOL)"
            value={formState.poolSymbol}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => formHandlers.setPoolSymbol(e.target.value)}
          />
        </InputContainer>

        <InputContainer>
          <InputLabel>Swap Fee (%)</InputLabel>
          <Input
            max="10"
            min="0"
            placeholder="Enter swap fee percentage (e.g., 0.01 for 0.01%)"
            step="0.001"
            type="number"
            value={formState.swapFee}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => formHandlers.setSwapFee(e.target.value)}
          />
        </InputContainer>

        <Divider style={{ margin: "24px 0" }} />

        <SmartFlex center="y" style={{ justifyContent: "space-between", marginBottom: "24px" }}>
          <Text type="H">Pool Tokens</Text>
          <Button
            disabled={formState.tokens.length >= 8} // Limit to 8 tokens
            green
            onClick={formHandlers.addToken}
          >
            Add Token
          </Button>
        </SmartFlex>

        {formState.tokens.map((token, index) => (
          <TokenInput
            key={index}
            amount={formState.tokenAmounts[index]}
            canRemove={formState.tokens.length > 2}
            index={index}
            token={token}
            weight={formState.weights[index]}
            onAmountChange={(amount) => formHandlers.handleAmountChange(index, amount)}
            onRemove={() => formHandlers.removeToken(index)}
            onTokenChange={(newToken) => handleTokenChange(index, newToken)}
            onWeightChange={(weight) => formHandlers.handleWeightChange(index, weight)}
          />
        ))}

        <Divider style={{ margin: "24px 0" }} />

        {formState.error && (
          <ErrorContainer>
            <Text type="SUPPORTING">{formState.error}</Text>
          </ErrorContainer>
        )}

        <SmartFlex gap="12px">
          <Button disabled={!wallet} style={{ width: "100%" }} green onClick={handleCreatePool}>
            {wallet ? (formState.isLoading ? "Creating Pool..." : "Create Pool") : "Connect Wallet"}
          </Button>

          {!wallet && (
            <ConnectWalletButton targetKey="pool_creation_connect_btn" fitContent>
              <Button style={{ width: "100%" }} grey>
                Connect Wallet
              </Button>
            </ConnectWalletButton>
          )}
        </SmartFlex>
      </div>
    </Root>
  );
};

export default PoolCreation;
