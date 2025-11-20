import { getPublicClient } from "@wagmi/core";
import { getContract } from "viem";

import { wagmiConfig } from "@constants/wagmiConfig";

import { RANGE_POOL_ABI } from "../abi/rangePoolABI";
import { ERC20_ABI, VAULT_ABI } from "../abi/vaultPoolTokensABI";

export interface PoolDetails {
  address: string;
  tokens: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  }[];
  feeTier: string;
  currentPrice: string;
  name: string;
  symbol: string;
  totalSupply: string;
  actualSupply: string;
  totalLiquidity: string;
  swapFeePercentage: string;
  normalizedWeights: string[];
  scalingFactors: string[];
  virtualBalances: string[];
  invariant: string;
  lastPostJoinExitInvariant: string;
  poolId: string;
  owner: string;
  vault: string;
  paused: boolean;
  inRecoveryMode: boolean;
  ATHRateProduct: string;
  transactions: any[]; // Array to hold pool transaction history
}

export class PoolDetailsService {
  static async fetchPoolDetails(poolAddress: string): Promise<PoolDetails> {
    try {
      const publicClient = getPublicClient(wagmiConfig);
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      const contract = getContract({
        address: poolAddress as `0x${string}`,
        abi: RANGE_POOL_ABI,
        client: publicClient,
      });

      // Fetch all pool information concurrently
      const [
        name,
        symbol,
        totalSupply,
        actualSupply,
        swapFeePercentage,
        normalizedWeights,
        scalingFactors,
        virtualBalances,
        invariant,
        lastPostJoinExitInvariant,
        poolId,
        owner,
        vault,
        pausedState,
        inRecoveryMode,
        ATHRateProduct,
      ] = await Promise.all([
        contract.read.name().catch(() => "Unknown"),
        contract.read.symbol().catch(() => "Unknown"),
        contract.read.totalSupply().catch(() => "0"),
        contract.read.getActualSupply().catch(() => "0"),
        contract.read.getSwapFeePercentage().catch(() => "0"),
        contract.read.getNormalizedWeights().catch(() => []),
        contract.read.getScalingFactors().catch(() => []),
        contract.read.getVirtualBalances().catch(() => []),
        contract.read.getInvariant().catch(() => "0"),
        contract.read.getLastPostJoinExitInvariant().catch(() => "0"),
        contract.read.getPoolId().catch(() => "0x0"),
        contract.read.getOwner().catch(() => "0x0"),
        contract.read.getVault().catch(() => "0x0"),
        contract.read.getPausedState().catch(() => ({ paused: false })),
        contract.read.inRecoveryMode().catch(() => false),
        contract.read.getATHRateProduct().catch(() => "0"),
      ]);

      // Get tokens from the pool data service to match what's in the JSON
      let tokens: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
      }[] = [];

      // First, try to get tokens from the pool data service to match the JSON file
      try {
        const poolListService = await import("../services/PoolListService").then((m) => m.default);
        const poolData = await poolListService.getPoolByAddress(poolAddress);

        if (poolData && poolData.tokens) {
          // Use tokens from the JSON data
          tokens = poolData.tokens.map((token) => ({
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
          }));
        } else {
          // Fallback: get tokens from the vault
          if (vault && vault !== "0x0") {
            const vaultContract = getContract({
              address: vault as `0x${string}`,
              abi: VAULT_ABI,
              client: publicClient,
            });

            const poolTokens = (await vaultContract.read.getPoolTokens([poolId as `0x${string}`])) as [
              string[],
              bigint[],
              bigint,
            ];
            const vaultTokens = poolTokens[0];

            for (const tokenAddress of vaultTokens) {
              const tokenContract = getContract({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                client: publicClient,
              });

              try {
                const [name, symbol, decimals] = await Promise.all([
                  tokenContract.read.name().catch(() => "Unknown"),
                  tokenContract.read.symbol().catch(() => "Unknown"),
                  tokenContract.read.decimals().catch(() => 18),
                ]);

                tokens.push({
                  address: tokenAddress,
                  name: name as string,
                  symbol: symbol as string,
                  decimals: Number(decimals),
                });
              } catch (e) {
                console.error("Error fetching token details:", e);
                tokens.push({
                  address: tokenAddress,
                  name: "Unknown",
                  symbol: "Unknown",
                  decimals: 18,
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("Error fetching pool tokens:", e);
      }

      // Initialize transactions array - get from the pool data service
      let transactions: any[] = [];

      // Get transactions from the pool data service
      try {
        const poolListService = await import("../services/PoolListService").then((m) => m.default);
        const poolData = await poolListService.getPoolByAddress(poolAddress);

        if (poolData && poolData.transactions) {
          transactions = poolData.transactions;
        }
      } catch (e) {
        console.error("Error fetching pool transactions:", e);
        transactions = [];
      }

      // Calculate fee tier as percentage (swap fee percentage is typically in basis points)
      const feeTier = `${Number(swapFeePercentage) / 10000000}%`; // Convert from basis points or other unit

      // For current price, we would typically calculate from reserves or other data
      // For now, we'll provide a placeholder - this would need to be calculated from actual reserves
      const currentPrice = "N/A";

      // Calculate total liquidity (this would be based on actual token reserves)
      const totalLiquidity = "N/A";

      return {
        address: poolAddress,
        tokens,
        feeTier,
        currentPrice,
        name: name as string,
        symbol: symbol as string,
        totalSupply: (totalSupply as bigint).toString(),
        actualSupply: (actualSupply as bigint).toString(),
        totalLiquidity,
        swapFeePercentage: (swapFeePercentage as bigint).toString(),
        normalizedWeights: (normalizedWeights as bigint[]).map((w) => w.toString()),
        scalingFactors: (scalingFactors as bigint[]).map((sf) => sf.toString()),
        virtualBalances: (virtualBalances as bigint[]).map((vb) => vb.toString()),
        invariant: (invariant as bigint).toString(),
        lastPostJoinExitInvariant: (lastPostJoinExitInvariant as bigint).toString(),
        poolId: poolId as string,
        owner: owner as string,
        vault: vault as string,
        paused: (pausedState as any).paused || false,
        inRecoveryMode: inRecoveryMode as boolean,
        ATHRateProduct: (ATHRateProduct as bigint).toString(),
        transactions,
      };
    } catch (error) {
      console.error(`Error fetching details for pool ${poolAddress}:`, error);
      return {
        address: poolAddress,
        tokens: [
          {
            address: "Error",
            name: "Error",
            symbol: "Error",
            decimals: 0,
          },
        ],
        feeTier: "Error",
        currentPrice: "Error",
        name: "Error",
        symbol: "Error",
        totalSupply: "Error",
        actualSupply: "Error",
        totalLiquidity: "Error",
        swapFeePercentage: "Error",
        normalizedWeights: [],
        scalingFactors: [],
        virtualBalances: [],
        invariant: "Error",
        lastPostJoinExitInvariant: "Error",
        poolId: "Error",
        owner: "Error",
        vault: "Error",
        paused: false,
        inRecoveryMode: false,
        ATHRateProduct: "Error",
        transactions: [],
      };
    }
  }

  static async fetchMultiplePoolDetails(poolAddresses: string[]): Promise<PoolDetails[]> {
    // Fetch details for multiple pools concurrently, but with a limit to avoid overwhelming the RPC
    const batchSize = 5; // Limit concurrent requests to avoid rate limiting
    const results: PoolDetails[] = [];

    for (let i = 0; i < poolAddresses.length; i += batchSize) {
      const batch = poolAddresses.slice(i, i + batchSize);
      const batchPromises = batch.map((address) => this.fetchPoolDetails(address));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}
