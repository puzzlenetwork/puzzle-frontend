import { getAbiItem } from "viem";

import { RANGE_POOL_FACTORY_ABI } from "../abi/rangePoolFactoryABI";
import { NETWORKS } from "../constants";
import { NetworkConfig } from "../constants/networkConfig";

interface PoolCreatedEvent {
  pool: string;
  blockNumber: number;
  transactionHash: string;
}

class RangePoolFactoryService {
  private publicClient: any | null = null;
  private factoryAddress: string;

  constructor() {
    this.factoryAddress = NetworkConfig[NETWORKS.SEPOLIA].rangePoolFactoryAddress;
  }

  public async initialize(client: any) {
    this.publicClient = client;
    if (!this.factoryAddress) {
      throw new Error("RANGE_POOL_FACTORY_ADDRESS is not set in network configuration");
    }
  }

  public async fetchAllPoolCreatedEvents(): Promise<PoolCreatedEvent[]> {
    if (!this.publicClient) {
      throw new Error("Service not initialized. Call initialize() first.");
    }

    try {
      // Get the PoolCreated event logs
      const poolCreatedEvent = getAbiItem({
        abi: RANGE_POOL_FACTORY_ABI,
        name: "PoolCreated",
      });

      // Get the latest block number
      const latestBlock = await this.publicClient.getBlockNumber();
      const startBlock = 9185327n;

      // Define chunk size (e.g., 5000 blocks at a time to stay under the 10000 block limit)
      const chunkSize = 5000n;

      let currentBlock = startBlock;
      const allLogs: any[] = [];

      // Fetch logs in chunks
      while (currentBlock <= latestBlock) {
        const toBlock = currentBlock + chunkSize - 1n > latestBlock ? latestBlock : currentBlock + chunkSize - 1n;

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
      const poolCreatedEvents: PoolCreatedEvent[] = allLogs.map((log: any) => {
        return {
          pool: log.args.pool,
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
        };
      });

      return poolCreatedEvents;
    } catch (error) {
      console.error("Error fetching PoolCreated events:", error);
      throw error;
    }
  }
}

export default new RangePoolFactoryService();
