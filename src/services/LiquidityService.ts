import { getPublicClient, writeContract } from "@wagmi/core";
import { getContract } from "viem";
import { formatUnits, parseUnits } from "viem";
import type { Config } from "wagmi";

import { wagmiConfig } from "@constants/wagmiConfig";

import { RANGE_POOL_ABI } from "../abi/rangePoolABI";
import { VAULT_ABI } from "../abi/vaultABI";

// Complete ERC20 ABI with approve function
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface JoinPoolParams {
  poolId: string;
  tokens: string[]; // Array of token addresses
  amounts: string[]; // Array of amounts in string format
  minBptAmount: string; // Minimum BPT amount to receive
  sender: string; // Sender address
  recipient: string; // Recipient address
  fromInternalBalance: boolean;
}

export interface ExitPoolParams {
  poolId: string;
  tokens: string[]; // Array of token addresses
  amounts: string[]; // Array of amounts in string format
  maxBptAmount: string; // Maximum BPT amount to burn
  sender: string; // Sender address
  recipient: string; // Recipient address
  toInternalBalance: boolean;
}

export interface TokenAmount {
  tokenAddress: string;
  amount: string;
  decimals: number;
}

export class LiquidityService {
  static async approveTokensForVault(
    tokenAddresses: string[],
    vaultAddress: string,
    amounts: string[],
    decimalsArray: number[],
    wagmiConfig: Config,
  ): Promise<`0x${string}`[]> {
    const publicClient = getPublicClient(wagmiConfig);
    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const hashes: `0x${string}`[] = [];

    for (let i = 0; i < tokenAddresses.length; i++) {
      const tokenAddress = tokenAddresses[i] as `0x${string}`;
      const amount = amounts[i];
      const decimals = decimalsArray[i];

      // Check current allowance - for this simplified version, we'll skip the check and just approve
      const amountBigInt = parseUnits(amount, decimals);

      // Approve the vault to spend the tokens
      const hash = await writeContract(wagmiConfig, {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [vaultAddress as `0x${string}`, amountBigInt],
      });

      hashes.push(hash);
    }

    return hashes;
  }

  static async joinPool(
    poolId: string,
    tokens: string[],
    amounts: string[],
    minBptAmount: string,
    sender: string,
    recipient: string,
    fromInternalBalance: boolean,
    wagmiConfig: Config,
  ): Promise<`0x${string}`> {
    // Get the vault address from the pool
    const publicClient = getPublicClient(wagmiConfig);
    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const poolContract = getContract({
      address: sender as `0x${string}`, // sender is the pool address here
      abi: RANGE_POOL_ABI,
      client: publicClient,
    });

    const vaultAddress = (await poolContract.read.getVault()) as `0x${string}`;

    // Convert amounts to BigInts
    const amountsBigInt = amounts.map((amount) => BigInt(amount));

    return await writeContract(wagmiConfig, {
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: "joinPool",
      args: [
        poolId as `0x${string}`,
        sender as `0x${string}`,
        recipient as `0x${string}`,
        {
          assets: tokens.map((t) => t as `0x${string}`),
          maxAmountsIn: amountsBigInt,
          userData: "0x", // Empty user data for now
          fromInternalBalance: fromInternalBalance,
        },
      ],
    });
  }

  static async exitPool(
    poolId: string,
    tokens: string[],
    amounts: string[],
    maxBptAmount: string,
    sender: string,
    recipient: string,
    toInternalBalance: boolean,
    wagmiConfig: Config,
  ): Promise<`0x${string}`> {
    // Get the vault address from the pool
    const publicClient = getPublicClient(wagmiConfig);
    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const poolContract = getContract({
      address: sender as `0x${string}`, // sender is the pool address here
      abi: RANGE_POOL_ABI,
      client: publicClient,
    });

    const vaultAddress = (await poolContract.read.getVault()) as `0x${string}`;

    // Convert amounts to BigInts
    const amountsBigInt = amounts.map((amount) => BigInt(amount));

    return await writeContract(wagmiConfig, {
      address: vaultAddress,
      abi: VAULT_ABI,
      functionName: "exitPool",
      args: [
        poolId as `0x${string}`,
        sender as `0x${string}`,
        recipient as `0x${string}`,
        {
          assets: tokens.map((t) => t as `0x${string}`),
          minAmountsOut: amountsBigInt,
          userData: "0x", // Empty user data for now
          toInternalBalance: toInternalBalance,
        },
      ],
    });
  }

  static async getPoolTokens(
    poolAddress: string,
    poolId: string,
  ): Promise<{ tokens: string[]; balances: string[]; decimals: number[] }> {
    const publicClient = getPublicClient(wagmiConfig);
    if (!publicClient) {
      throw new Error("Public client not available");
    }

    // Get vault address from pool
    const poolContract = getContract({
      address: poolAddress as `0x${string}`,
      abi: RANGE_POOL_ABI,
      client: publicClient,
    });

    const vaultAddress = await poolContract.read.getVault();

    // Get tokens and balances from vault
    const vaultContract = getContract({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      client: publicClient,
    });

    const [tokens, balances] = (await vaultContract.read.getPoolTokens([poolId as `0x${string}`])) as [
      string[],
      bigint[],
    ];

    // Get decimals for each token
    const decimals: number[] = [];
    for (const tokenAddress of tokens) {
      const tokenContract = getContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        client: publicClient,
      });

      const tokenDecimals = await tokenContract.read.decimals().catch(() => 18);
      decimals.push(Number(tokenDecimals));
    }

    return {
      tokens,
      balances: balances.map((b) => b.toString()),
      decimals,
    };
  }

  static async getPoolShare(poolAddress: string, userAddress: string): Promise<string> {
    const publicClient = getPublicClient(wagmiConfig);
    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const poolContract = getContract({
      address: poolAddress as `0x${string}`,
      abi: RANGE_POOL_ABI,
      client: publicClient,
    });

    const balance = (await poolContract.read.balanceOf([userAddress as `0x${string}`])) as bigint;
    const totalSupply = (await poolContract.read.totalSupply()) as bigint;

    if (totalSupply === 0n) {
      return "0";
    }

    const share = (balance * 100n) / totalSupply; // Calculate percentage
    return formatUnits(share, 2);
  }
}
