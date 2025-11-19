import PoolCreationEventFetcher, { PoolCreatedEvent } from './fetchPoolCreationEvents';
import PoolTokenDataFetcher from './fetchPoolTokenData';

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

    // Extract just the pool addresses for batch processing
    const poolAddresses = poolEvents.map(event => event.pool);

    console.log('Fetching token data for all pools...');
    const poolTokenData = await this.tokenDataFetcher.fetchMultiplePoolTokenData(poolAddresses);
    console.log('Completed fetching token data');

    // Combine the information
    const completeData: CompletePoolData[] = poolEvents.map((event, index) => {
      const tokenData = poolTokenData[index];
      return {
        poolAddress: event.pool,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        name: tokenData.name,
        symbol: tokenData.symbol,
        totalSupply: tokenData.totalSupply,
        tokens: tokenData.tokens,
      };
    });

    return completeData;
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