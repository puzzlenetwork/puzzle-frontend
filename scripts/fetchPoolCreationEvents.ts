import { createPublicClient, getAbiItem,http } from 'viem';
import { sepolia } from 'wagmi/chains';

import { RANGE_POOL_FACTORY_ABI } from './abi/rangePoolFactoryABI';
import { FACTORY_ADDRESSES, NETWORKS } from './constants';

export interface PoolCreatedEvent {
  pool: string;
  blockNumber: number;
  transactionHash: string;
  transactionData?: any; // Transaction data that may contain token information
}

class PoolCreationEventFetcher {
  private publicClient: any;
  private factoryAddress: string;

  constructor() {
    this.factoryAddress = FACTORY_ADDRESSES[NETWORKS.SEPOLIA];
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
  }

 public async fetchAllPoolCreatedEvents(): Promise<PoolCreatedEvent[]> {
    try {
      // Get the PoolCreated event from ABI
      const poolCreatedEvent = getAbiItem({
        abi: RANGE_POOL_FACTORY_ABI,
        name: 'PoolCreated',
      });
      
      // Get the latest block number
      const latestBlock = await this.publicClient.getBlockNumber();
      const startBlock = 9185327n; // Starting block as defined in the original service
      
      // Define chunk size (e.g., 5000 blocks at a time to stay under the 10000 block limit)
      const chunkSize = 5000n;
      
      let currentBlock = startBlock;
      const allLogs: any[] = [];
      
      // Fetch logs in chunks
      while (currentBlock <= latestBlock) {
        const toBlock = currentBlock + chunkSize - 1n > latestBlock
          ? latestBlock
          : currentBlock + chunkSize - 1n;
          
        const logs = await this.publicClient.getLogs({
          address: this.factoryAddress as `0x${string}`,
          event: poolCreatedEvent,
          fromBlock: currentBlock,
          toBlock: toBlock,
        });
        
        allLogs.push(...logs);
        
        // Move to the next chunk
        currentBlock = toBlock + 1n;
      }
      
      // Format the events to extract necessary information
      const poolCreatedEvents: PoolCreatedEvent[] = await Promise.all(allLogs.map(async (log: any) => {
        // Get the transaction to get input data
        const transaction = await this.publicClient.getTransaction({
          hash: log.transactionHash as `0x${string}`,
        });

        return {
          pool: log.args.pool,
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          transactionData: transaction,
        };
      }));

      return poolCreatedEvents;
    } catch (error) {
      console.error('Error fetching PoolCreated events:', error);
      throw error;
    }
  }
}

export default PoolCreationEventFetcher;