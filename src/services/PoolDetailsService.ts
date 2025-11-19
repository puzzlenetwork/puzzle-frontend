import { getPublicClient } from "@wagmi/core";
import { getContract } from "viem";

import { wagmiConfig } from "@constants/wagmiConfig";

import { RANGE_POOL_ABI } from "../abi/rangePoolABI";

export interface PoolDetails {
  address: string;
  token0: string;
  token1: string;
  feeTier: string;
  currentPrice: string;
  name: string;
  symbol: string;
  totalSupply: string;
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

      // Fetch basic pool information
      const [name, symbol, totalSupply, swapFeePercentage, normalizedWeights] = await Promise.all([
        contract.read.name().catch(() => "Unknown"),
        contract.read.symbol().catch(() => "Unknown"),
        contract.read.totalSupply().catch(() => "0"),
        contract.read.getSwapFeePercentage().catch(() => "0"),
        contract.read.getNormalizedWeights().catch(() => []),
      ]);

      // Extract token information from normalized weights
      // In a weighted pool, the normalized weights represent the relative weights of tokens
      // For a 2-token pool, we typically have 2 weights
      let token0 = "Unknown";
      let token1 = "Unknown";

      if (Array.isArray(normalizedWeights) && normalizedWeights.length >= 2) {
        // For this implementation, we'll use the normalized weights to represent token info
        // In a real implementation, we might need to get actual token addresses
        token0 = `Token0 (${(normalizedWeights[0] as bigint)?.toString() || "N/A"})`;
        token1 = `Token1 (${(normalizedWeights[1] as bigint)?.toString() || "N/A"})`;
      } else {
        // Default values if we can't get normalized weights
        token0 = "Token0";
        token1 = "Token1";
      }

      // Calculate fee tier as percentage (swap fee percentage is typically in basis points)
      const feeTier = `${Number(swapFeePercentage) / 1000000}%`; // Convert from basis points or other unit

      // For current price, we would typically calculate from reserves or other data
      // For now, we'll provide a placeholder
      const currentPrice = "N/A";

      return {
        address: poolAddress,
        token0,
        token1,
        feeTier,
        currentPrice,
        name: name as string,
        symbol: symbol as string,
        totalSupply: (totalSupply as bigint).toString(),
      };
    } catch (error) {
      console.error(`Error fetching details for pool ${poolAddress}:`, error);
      return {
        address: poolAddress,
        token0: "Error",
        token1: "Error",
        feeTier: "Error",
        currentPrice: "Error",
        name: "Error",
        symbol: "Error",
        totalSupply: "Error",
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
