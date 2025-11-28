import { useEffect, useState } from "react";

import { TOKEN_TYPE, TOKENS, TTokenConfig } from "@constants/tokenConfig";

import { Token } from "@entity/Token";

export interface PoolFormState {
  poolName: string;
  poolSymbol: string;
  tokens: (Token | null)[];
  tokenAmounts: string[];
  weights: string[];
  swapFee: string;
  isLoading: boolean;
  error: string | null;
}

export interface PoolFormHandlers {
  handleTokenChange: (index: number, token: Token | null) => Promise<void>;
  handleAmountChange: (index: number, amount: string) => void;
  handleWeightChange: (index: number, weight: string) => void;
  addToken: () => void;
  removeToken: (index: number) => void;
  setPoolName: (name: string) => void;
  setPoolSymbol: (symbol: string) => void;
  setSwapFee: (fee: string) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const usePoolForm = (): [PoolFormState, PoolFormHandlers] => {
  // Pool creation form state
  const [poolName, setPoolName] = useState("");
  const [poolSymbol, setPoolSymbol] = useState("");
  const [tokens, setTokens] = useState<(Token | null)[]>([]);
  const [tokenAmounts, setTokenAmounts] = useState<string[]>([]);
  const [weights, setWeights] = useState<string[]>([]);
  const [swapFee, setSwapFee] = useState("0.01"); // Default to 1%
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with 2 tokens
  useEffect(() => {
    const emptyTokenConfig: TTokenConfig = {
      type: TOKEN_TYPE.ERC20,
      symbol: TOKENS.VOV,
      name: "Empty Token",
      decimals: 18,
      address: "0x00000000",
    };
    const emptyToken = new Token(emptyTokenConfig);
    setTokens([emptyToken, emptyToken]);
    setTokenAmounts(["", ""]);
    setWeights(["50", "50"]);
  }, []);

  const handleAmountChange = (index: number, amount: string) => {
    const newAmounts = [...tokenAmounts];
    newAmounts[index] = amount;
    setTokenAmounts(newAmounts);
  };

  const handleWeightChange = (index: number, weight: string) => {
    const newWeights = [...weights];
    newWeights[index] = weight;
    setWeights(newWeights);
  };

  const addToken = () => {
    const emptyTokenConfig: TTokenConfig = {
      type: TOKEN_TYPE.ERC20,
      symbol: TOKENS.VOV,
      name: "Empty Token",
      decimals: 18,
      address: "0x000000",
    };
    const emptyToken = new Token(emptyTokenConfig);
    setTokens([...tokens, emptyToken]);
    setTokenAmounts([...tokenAmounts, ""]);
    setWeights([...weights, ""]);
  };

  const removeToken = (index: number) => {
    if (tokens.length <= 2) return; // Keep at least 2 tokens

    const newTokens = [...tokens];
    newTokens.splice(index, 1);
    setTokens(newTokens);

    const newAmounts = [...tokenAmounts];
    newAmounts.splice(index, 1);
    setTokenAmounts(newAmounts);

    const newWeights = [...weights];
    newWeights.splice(index, 1);
    setWeights(newWeights);
  };

  const handleTokenChange = async (index: number, token: Token | null) => {
    // If the token is null or has all required details, set it directly
    if (!token || (token.name && token.symbol && token.decimals && token.address)) {
      const newTokens = [...tokens];
      newTokens[index] = token;
      setTokens(newTokens);
      return;
    }

    // If we have an address but missing details, fetch them from blockchain
    if (token?.address && (!token.name || !token.symbol || !token.decimals)) {
      // For now, we'll implement the token details fetching in the main component
      // since it requires the publicClient which is not available in this hook
      const newTokens = [...tokens];
      newTokens[index] = token;
      setTokens(newTokens);
      return;
    }

    // If we couldn't fetch details, set the token as is
    const newTokens = [...tokens];
    newTokens[index] = token;
    setTokens(newTokens);
  };

  return [
    {
      poolName,
      poolSymbol,
      tokens,
      tokenAmounts,
      weights,
      swapFee,
      isLoading,
      error,
    },
    {
      handleTokenChange,
      handleAmountChange,
      handleWeightChange,
      addToken,
      removeToken,
      setPoolName,
      setPoolSymbol,
      setSwapFee,
      setError,
      setIsLoading,
    },
  ];
};
