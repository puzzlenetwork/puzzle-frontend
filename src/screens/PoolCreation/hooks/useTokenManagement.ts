import { usePublicClient } from "wagmi";

import { TOKEN_TYPE, TOKENS, TTokenConfig } from "@constants/tokenConfig";

import { Token } from "@entity/Token";

// ERC20 ABI for fetching token details
const ERC20_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface TokenDetails {
  name: string;
  symbol: string;
  decimals: number;
  address: `0x${string}`;
  type: TOKEN_TYPE.ERC20;
}

export const useTokenManagement = () => {
  const publicClient = usePublicClient();

  // Function to fetch token details from blockchain
  const fetchTokenDetails = async (address: string): Promise<TokenDetails | null> => {
    if (!publicClient || !address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return null;
    }

    try {
      const [name, symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "name",
        }),
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
      ]);

      return {
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        address: address as `0x${string}`,
        type: TOKEN_TYPE.ERC20,
      };
    } catch (error) {
      console.error("Error fetching token details:", error);
      return null;
    }
  };

  const createTokenFromDetails = (tokenDetails: TokenDetails): Token => {
    // Generate a temporary symbol based on the fetched symbol if it's not in our TOKENS enum
    let tokenSymbol = TOKENS.VOV; // default fallback
    if (Object.values(TOKENS).includes(tokenDetails.symbol as TOKENS)) {
      tokenSymbol = tokenDetails.symbol as TOKENS;
    } else {
      // If the fetched symbol is not in our enum, we'll use a default but keep the real name
      tokenSymbol = TOKENS.VOV;
    }

    const newTokenConfig: TTokenConfig = {
      type: TOKEN_TYPE.ERC20,
      name: tokenDetails.name,
      symbol: tokenSymbol,
      decimals: tokenDetails.decimals,
      address: tokenDetails.address,
    };
    return new Token(newTokenConfig);
  };

  return {
    fetchTokenDetails,
    createTokenFromDetails,
  };
};
