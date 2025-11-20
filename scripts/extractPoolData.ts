import { decodeFunctionData, parseAbi } from 'viem';

import { RANGE_POOL_FACTORY_ABI } from './abi/rangePoolFactoryABI';
import PoolCreationEventFetcher, { PoolCreatedEvent } from './fetchPoolCreationEvents';
import PoolTokenDataFetcher, { TokenInfo } from './fetchPoolTokenData';

interface CompletePoolData {
  poolAddress: string;
 blockNumber: number;
  transactionHash: string;
  name: string;
  symbol: string;
  totalSupply: string;
  tokens: any[];
}

class PoolDataExtractor {
  private eventFetcher: PoolCreationEventFetcher;
  private tokenDataFetcher: PoolTokenDataFetcher;

  constructor() {
    this.eventFetcher = new PoolCreationEventFetcher();
    this.tokenDataFetcher = new PoolTokenDataFetcher();
  }

 async extractAllPoolData(): Promise<CompletePoolData[]> {
    console.log('Fetching pool creation events...');
    const poolEvents: PoolCreatedEvent[] = await this.eventFetcher.fetchAllPoolCreatedEvents();
    console.log(`Found ${poolEvents.length} pool creation events`);

    // Extract token information from creation transactions
    const poolTokenDataPromises = poolEvents.map(async (event) => {
      if (event.transactionData) {
        try {
          // Decode the transaction input to extract token information
          const decodedData = decodeFunctionData({
            abi: RANGE_POOL_FACTORY_ABI,
            data: event.transactionData.input as `0x${string}`,
          });

          // Extract token addresses from the decoded data
          if (decodedData.functionName === 'create' && decodedData.args) {
            const tokenAddresses = decodedData.args[2] as `0x${string}`[]; // tokens parameter
            const poolName = decodedData.args[0] as string; // name parameter
            const poolSymbol = decodedData.args[1] as string; // symbol parameter
            
            // Fetch detailed token information for each token
            const tokenDetails = await this.fetchTokenDetails(tokenAddresses);
            
            // Fetch the actual total supply from the pool contract
            const { createPublicClient, http } = await import('viem');
            const { sepolia } = await import('wagmi/chains');
            
            const publicClient = createPublicClient({
              chain: sepolia,
              transport: http(),
            });
            
            let poolTotalSupply = '0';
            try {
              const supply = await publicClient.readContract({
                address: event.pool as `0x${string}`,
                abi: parseAbi(['function totalSupply() view returns (uint256)']),
                functionName: 'totalSupply',
              });
              poolTotalSupply = supply.toString();
            } catch (error) {
              console.error(`Error fetching total supply for pool ${event.pool}:`, error);
            }

            return {
              poolAddress: event.pool,
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
              name: poolName,
              symbol: poolSymbol,
              totalSupply: poolTotalSupply,
              tokens: tokenDetails,
            };
          }
        } catch (decodeError) {
          console.error(`Error decoding transaction data for pool ${event.pool}:`, decodeError);
        }
      }
      
      // Fallback to original method if transaction data is not available
      const fallbackData = await this.tokenDataFetcher.fetchPoolTokenData(event.pool);
      return {
        poolAddress: event.pool,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        name: fallbackData.name,
        symbol: fallbackData.symbol,
        totalSupply: fallbackData.totalSupply,
        tokens: fallbackData.tokens,
      };
    });

    const poolTokenData = await Promise.all(poolTokenDataPromises);
    console.log('Completed fetching token data');

    return poolTokenData;
  }

  private async fetchTokenDetails(tokenAddresses: `0x${string}`[]): Promise<TokenInfo[]> {
    const { createPublicClient, http } = await import('viem');
    const { sepolia } = await import('wagmi/chains');
    
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    const tokenDetailsPromises = tokenAddresses.map(async (tokenAddress) => {
      try {
        // Get token name
        let name: string;
        try {
          name = await publicClient.readContract({
            address: tokenAddress,
            abi: parseAbi(['function name() view returns (string)']),
            functionName: 'name',
          }) as string;
        } catch {
          name = 'Unknown';
        }

        // Get token symbol
        let symbol: string;
        try {
          symbol = await publicClient.readContract({
            address: tokenAddress,
            abi: parseAbi(['function symbol() view returns (string)']),
            functionName: 'symbol',
          }) as string;
        } catch {
          symbol = 'UNKNOWN';
        }

        // Get token decimals
        let decimals: number;
        try {
          decimals = Number(await publicClient.readContract({
            address: tokenAddress,
            abi: parseAbi(['function decimals() view returns (uint8)']),
            functionName: 'decimals',
          }));
        } catch {
          decimals = 18; // Default to 18 decimals if not available
        }

        return {
          address: tokenAddress,
          name,
          symbol,
          decimals,
        };
      } catch (error) {
        console.error(`Error fetching details for token ${tokenAddress}:`, error);
        return {
          address: tokenAddress,
          name: 'Error',
          symbol: 'ERROR',
          decimals: 0,
        };
      }
    });

    return Promise.all(tokenDetailsPromises);
  }
  
  async saveToFile(data: CompletePoolData[], filename: string = 'poolData.json'): Promise<void> {
    // Convert BigInt values to strings for JSON serialization
    const serializedData = data.map(item => ({
      ...item,
      totalSupply: item.totalSupply.toString(),
    }));

    const fs = await import('fs');
    await fs.promises.writeFile(filename, JSON.stringify(serializedData, null, 2));
    console.log(`Data saved to ${filename}`);
  }
}

// Example usage
async function main() {
  const extractor = new PoolDataExtractor();
  
  try {
    const data = await extractor.extractAllPoolData();
    console.log(`Extracted data for ${data.length} pools`);
    
    // Print first few results as example
    data.slice(0, 5).forEach((pool, index) => {
      console.log(`\nPool ${index + 1}:`);
      console.log(`  Address: ${pool.poolAddress}`);
      console.log(`  Name: ${pool.name}`);
      console.log(`  Symbol: ${pool.symbol}`);
      console.log(`  Block: ${pool.blockNumber}`);
      console.log(`  Tx Hash: ${pool.transactionHash}`);
      console.log(`  Total Supply: ${pool.totalSupply}`);
      console.log(`  Tokens: ${pool.tokens.length}`);
    });
    
    // Save all data to a file
    await extractor.saveToFile(data, 'allPoolsData.json');
  } catch (error) {
    console.error('Error extracting pool data:', error);
  }
}

// Only run the main function if this file is executed directly
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].includes('extractPoolData.ts')) {
  main().catch(console.error);
}

export default PoolDataExtractor;