class PoolListService {
  private poolsData: PoolData[] | null = null;

  async loadPoolsData(): Promise<PoolData[]> {
    if (this.poolsData) {
      return this.poolsData;
    }

    try {
      // Load the JSON data from the public directory
      const response = await fetch("/allPoolsData.json");
      if (!response.ok) {
        throw new Error(`Failed to load pools data: ${response.statusText}`);
      }

      const data = await response.json();
      this.poolsData = data;
      return data;
    } catch (error) {
      console.error("Error loading pools data:", error);
      // Return an empty array in case of error
      return [];
    }
  }

  async getPoolsData(): Promise<PoolData[]> {
    if (this.poolsData) {
      return this.poolsData;
    }

    return this.loadPoolsData();
  }

  async searchPools(query: string): Promise<PoolData[]> {
    const allPools = await this.getPoolsData();
    if (!query) return allPools;

    const lowerQuery = query.toLowerCase();
    return allPools.filter(
      (pool) =>
        pool.poolAddress.toLowerCase().includes(lowerQuery) ||
        pool.name.toLowerCase().includes(lowerQuery) ||
        pool.symbol.toLowerCase().includes(lowerQuery) ||
        pool.tokens.some(
          (token) => token.name.toLowerCase().includes(lowerQuery) || token.symbol.toLowerCase().includes(lowerQuery),
        ),
    );
  }

  async getPoolByAddress(address: string): Promise<PoolData | undefined> {
    const allPools = await this.getPoolsData();
    return allPools.find((pool) => pool.poolAddress.toLowerCase() === address.toLowerCase());
  }

  // Method to return data in the format expected by the original PoolList component
  async getPoolsForListComponent(): Promise<{ pool: string; blockNumber: number; transactionHash: string }[]> {
    const pools = await this.getPoolsData();
    return pools.map((poolData) => ({
      pool: poolData.poolAddress,
      blockNumber: poolData.blockNumber,
      transactionHash: poolData.transactionHash,
    }));
  }
}

export interface PoolData {
  poolAddress: string;
  blockNumber: number;
  transactionHash: string;
  name: string;
  symbol: string;
  totalSupply: string;
  tokens: TokenInfo[];
  transactions?: any[];
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export default new PoolListService();
