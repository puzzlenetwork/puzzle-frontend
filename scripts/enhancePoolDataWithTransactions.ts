import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Define the structure of our pool data with transactions
interface TokenInfo {
  address: string;
  name: string;
 symbol: string;
  decimals: number;
}

interface PoolData {
  poolAddress: string;
 blockNumber: number;
  transactionHash: string;
 name: string;
 symbol: string;
  totalSupply: string;
  tokens: TokenInfo[];
  transactions?: TransactionData[]; // Optional since we're adding it
}

interface TransactionData {
 hash: string;
 type: string; // 'swap', 'join', 'exit'
  amount: string;
  timestamp: string;
 from: string;
  to: string;
}

// Function to generate mock transactions for a pool
function generateMockTransactions(poolAddress: string, count: number = 5): TransactionData[] {
  const transactions: TransactionData[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomType = ['swap', 'join', 'exit'][Math.floor(Math.random() * 3)] as 'swap' | 'join' | 'exit';
    
    transactions.push({
      hash: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      type: randomType,
      amount: (Math.random() * 1000).toFixed(6),
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 10000000)).toISOString(),
      from: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      to: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    });
  }
  
  return transactions;
}

// Main function to enhance the pool data
async function enhancePoolData() {
 try {
    // Get the directory name for ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Read the existing pool data
    const poolDataPath = join(__dirname, '../allPoolsData.json');
    const poolDataContent = fs.readFileSync(poolDataPath, 'utf8');
    const poolData: PoolData[] = JSON.parse(poolDataContent);
    
    // Enhance each pool with transaction history
    const enhancedPoolData = poolData.map(pool => {
      return {
        ...pool,
        transactions: generateMockTransactions(pool.poolAddress)
      };
    });
    
    // Write the enhanced data back to the file
    const outputPath = join(__dirname, '../allPoolsData.json');
    fs.writeFileSync(outputPath, JSON.stringify(enhancedPoolData, null, 2));
    
    console.log(`Enhanced pool data with transaction history for ${enhancedPoolData.length} pools`);
    
    // Also create a backup of the original
    const backupPath = join(__dirname, '../allPoolsData.backup.json');
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, poolDataContent);
      console.log('Created backup of original data');
    }
 } catch (error) {
    console.error('Error enhancing pool data:', error);
  }
}

// Run the enhancement
enhancePoolData();