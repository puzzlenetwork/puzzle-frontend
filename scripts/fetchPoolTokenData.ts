import { createPublicClient, http } from 'viem';
import { sepolia } from 'wagmi/chains';

import { RANGE_POOL_ABI } from './abi/rangePoolABI';

export interface PoolTokenData {
  address: string;
  name: string;
 symbol: string;
  decimals: number;
  totalSupply: string;
  tokens: TokenInfo[];
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

class PoolTokenDataFetcher {
  private publicClient: any;

  constructor() {
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
  }

  async fetchPoolTokenData(poolAddress: string): Promise<PoolTokenData> {
    try {
      // We're not using the contract object directly since we're using readContract instead
      // const contract = getContract({
      //   address: poolAddress as `0x${string}`,
      //   abi: RANGE_POOL_ABI,
      //   client: { public: this.publicClient },
      // });

      // Fetch basic pool information using Viem's readContract function
      const [nameResult, symbolResult, totalSupplyResult] = await Promise.allSettled([
        this.readContractWithFallback(poolAddress, 'name', 'Unknown'),
        this.readContractWithFallback(poolAddress, 'symbol', 'Unknown'),
        this.readContractWithFallback(poolAddress, 'totalSupply', '0'),
      ]);

      const name = nameResult.status === 'fulfilled' ? nameResult.value : 'Unknown';
      const symbol = symbolResult.status === 'fulfilled' ? symbolResult.value : 'Unknown';
      const totalSupply = totalSupplyResult.status === 'fulfilled' ? totalSupplyResult.value : '0';

      const tokens = await this.fetchTokensFromPool(poolAddress);

      return {
        address: poolAddress,
        name: name as string,
        symbol: symbol as string,
        decimals: 18, // Default decimals, may need to be fetched differently
        totalSupply: (totalSupply as bigint).toString(),
        tokens,
      };
    } catch (error) {
      console.error(`Error fetching token data for pool ${poolAddress}:`, error);
      throw error;
    }
  }

  private async readContractWithFallback(poolAddress: string, functionName: string, fallback: any) {
    try {
      const result = await this.publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: RANGE_POOL_ABI,
        functionName,
      });
      return result;
    } catch (error) {
      console.warn(`Could not read ${functionName} from pool ${poolAddress}, using fallback:`, error);
      return fallback;
    }
  }

 private async fetchTokensFromPool(poolAddress: string): Promise<TokenInfo[]> {
    try {
      // Try to get tokens from the pool directly
      // First, attempt to get the tokens array if available in the ABI
      const tokens: TokenInfo[] = [];
      
      // Try to get tokens using getNormalizedWeights and other methods
      try {
        const normalizedWeights: bigint[] = await this.publicClient.readContract({
          address: poolAddress as `0x${string}`,
          abi: RANGE_POOL_ABI,
          functionName: 'getNormalizedWeights',
        });
        // We fetch rateProviders but don't use it in the current implementation
        // const rateProviders: string[] = await this.publicClient.readContract({
        //   address: poolAddress as `0x${string}`,
        //   abi: RANGE_POOL_ABI,
        //   functionName: 'getRateProviders',
        // });
        
        // If we have normalized weights, we can potentially get token information
        if (normalizedWeights.length > 0) {
          // For each weight, we'll need to determine the corresponding token
          // This may require additional calls or may not be directly available in this ABI
          for (let i = 0; i < normalizedWeights.length; i++) {
            // Since we can't directly get token addresses from this ABI,
            // we'll need to use an alternative approach or assume we need
            // to get this information from the transaction data
            tokens.push({
              address: `Unknown Token ${i+1}`,
              name: `Unknown Token ${i+1}`,
              symbol: `TKN${i+1}`,
              decimals: 18,
            });
          }
        }
      } catch (e) {
        console.log(`Could not fetch normalized weights for pool ${poolAddress}:`, e);
      }

      // If we still don't have tokens, try other methods
      if (tokens.length === 0) {
        // Some pools might have specific functions to get token addresses
        // This varies by implementation, so we'll add common methods here
        try {
          // Attempt to call a function that might return token addresses
          // This is implementation-specific and may not exist in this ABI
          // We fetch poolId but don't use it in the current implementation
          // const poolId = await this.publicClient.readContract({
          //   address: poolAddress as `0x${string}`,
          //   abi: RANGE_POOL_ABI,
          //   functionName: 'getPoolId',
          // });
          // Note: In a real Balancer-style pool, we'd use the vault to get tokens
          // But this would require the vault address and additional setup
        } catch (e) {
          console.log(`Could not fetch pool ID for ${poolAddress}:`, e);
        }
      }

      return tokens;
    } catch (error) {
      console.error(`Error fetching tokens for pool ${poolAddress}:`, error);
      return [];
    }
  }

  async fetchMultiplePoolTokenData(poolAddresses: string[]): Promise<PoolTokenData[]> {
    // Fetch details for multiple pools concurrently, but with a limit to avoid overwhelming the RPC
    const batchSize = 5; // Limit concurrent requests to avoid rate limiting
    const results: PoolTokenData[] = [];

    for (let i = 0; i < poolAddresses.length; i += batchSize) {
      const batch = poolAddresses.slice(i, i + batchSize);
      const batchPromises = batch.map(address => this.fetchPoolTokenData(address));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Handle results and potential errors
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Error fetching data for pool ${batch[j]}:`, result.reason);
          // Add an error entry to maintain array alignment
          results.push({
            address: batch[j],
            name: 'Error',
            symbol: 'Error',
            decimals: 0,
            totalSupply: '0',
            tokens: [],
          });
        }
      }
    }

    return results;
  }
}

export default PoolTokenDataFetcher;