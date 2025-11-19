import { SepoliaTokenConfig, TOKENS, TTokenConfig } from "./tokenConfig";

export enum NETWORKS {
  SEPOLIA = "sepolia",
}

export type TNetworkConfig = {
  name: string;
  title?: string;
  chainId: number;
  rpc: string;
  poolAddress: `0x${string}`;
  vaultAddress: `0x${string}`;
  rangePoolQueriesAddress: `0x${string}`;
  rangePoolFactoryAddress: `0x${string}`;
  testnet?: boolean;
  tokens: Record<TOKENS, TTokenConfig>;
  explorer: string;
};

//price feeds https://www.pyth.network/developers/price-feed-ids
export const NetworkConfig: Record<string, TNetworkConfig> = {
  [NETWORKS.SEPOLIA]: {
    name: NETWORKS.SEPOLIA,
    chainId: 11155111,
    poolAddress: "0x191f973661f0f72a35b1941a51A1318A9259D5e4",
    vaultAddress: "0x7a6F77898fc906968D4b38AC4444E8442D80B37a",
    rangePoolQueriesAddress: "0x26be11301314349dfFF341511D1a843149afe3Bd",
    rangePoolFactoryAddress: "0x356632c353Cb850dd3E41e466FCbe5a0cAC003A8",
    rpc: "https://lingering-solemn-bush.ethereum-sepolia.quiknode.pro/7cf5758ea8bd58af63e0e32a06656e0d4a14f063/",
    explorer: "https://sepolia.etherscan.io",
    tokens: SepoliaTokenConfig,
  },
};
