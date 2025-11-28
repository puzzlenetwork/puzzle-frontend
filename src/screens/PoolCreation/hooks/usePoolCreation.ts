import { useNavigate } from "react-router-dom";
import { usePublicClient, useWalletClient } from "wagmi";

import { NETWORKS } from "@constants";
import { NetworkConfig } from "@constants/networkConfig";

import { DEFAULT_RATE_PROVIDER, ZERO_ADDRESS, ZERO_SALT } from "../constants";
import { PoolFormState, validateForm } from "../utils/validation";

export interface PoolCreationHandlers {
  createPool: (
    formState: PoolFormState,
    walletAddress: string | undefined,
    setIsLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
  ) => Promise<void>;
}

export const usePoolCreation = (): PoolCreationHandlers => {
  const navigate = useNavigate();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const createPool = async (
    formState: PoolFormState,
    walletAddress: string | undefined,
    setIsLoading: (loading: boolean) => void,
    setError: (error: string | null) => void,
  ): Promise<void> => {
    const validation = validateForm(formState);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    if (!walletClient || !publicClient) {
      setError("Wallet not connected or client not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert token addresses to the format expected by the contract
      const tokenAddresses = formState.tokens.map((token) => token?.address as `0x${string}`);

      // Convert weights to the format expected by the contract (normalized weights)
      const normalizedWeights = formState.weights
        .map((weight) => {
          // Convert percentage to normalized weight (multiply by 1e18)
          const weightValue = parseFloat(weight) / 100;
          return (weightValue * 1e18).toFixed(0);
        })
        .map((weight) => BigInt(weight));

      // Convert swap fee to the format expected by the contract (multiply by 1e18)
      const swapFeePercentage = (parseFloat(formState.swapFee) / 100) * 1e18;
      const swapFeeBigInt = BigInt(swapFeePercentage.toFixed(0));

      // Get the factory address from config
      const factoryAddress = NetworkConfig[NETWORKS.SEPOLIA].rangePoolFactoryAddress as `0x${string}`;

      // Prepare the transaction parameters
      const txParams = {
        address: factoryAddress,
        abi: [
          {
            inputs: [
              { name: "name", type: "string" },
              { name: "symbol", type: "string" },
              { name: "tokens", type: "address[]" },
              { name: "normalizedWeights", type: "uint256[]" },
              { name: "rateProviders", type: "address[]" },
              { name: "swapFeePercentage", type: "uint256" },
              { name: "owner", type: "address" },
              { name: "salt", type: "bytes32" },
            ],
            name: "create",
            outputs: [{ name: "", type: "address" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "create",
        args: [
          formState.poolName,
          formState.poolSymbol,
          tokenAddresses,
          normalizedWeights,
          // Rate providers - using zero addresses for now, can be updated later
          Array(formState.tokens.length).fill(DEFAULT_RATE_PROVIDER),
          swapFeeBigInt,
          // Using zero address as placeholder - this should be replaced with actual wallet address
          ZERO_ADDRESS, // Pool owner - needs to be replaced with actual wallet address
          ZERO_SALT, // Salt
        ],
      };

      // Send the transaction
      const hash = await walletClient.writeContract(txParams);

      // Wait for the transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });

      // Note: Initial liquidity for range pools would be handled in the LiquidityControls component
      // after the pool is created, not during the creation process itself

      // Redirect to pools list
      navigate("/pools");
    } catch (err: any) {
      console.error("Error creating pool:", err);
      setError(err.message || "An error occurred while creating the pool");
    } finally {
      setIsLoading(false);
    }
  };

  return { createPool };
};
