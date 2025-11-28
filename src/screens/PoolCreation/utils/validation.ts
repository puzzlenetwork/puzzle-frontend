import { Token } from "@entity/Token";

export interface PoolFormState {
  poolName: string;
  poolSymbol: string;
  tokens: (Token | null)[];
  tokenAmounts: string[];
  weights: string[];
  swapFee: string;
}

export const validateForm = (formState: PoolFormState): { isValid: boolean; error: string | null } => {
  // Check pool name
  if (!formState.poolName.trim()) {
    return { isValid: false, error: "Pool name is required" };
  }

  // Check pool symbol
  if (!formState.poolSymbol.trim()) {
    return { isValid: false, error: "Pool symbol is required" };
  }

  // Check tokens have addresses
  if (formState.tokens.some((token) => token === null || !token.address || token.address === "0x000000")) {
    return { isValid: false, error: "All tokens must have addresses" };
  }

  // Check token amounts are valid
  if (formState.tokenAmounts.some((amount) => !amount || parseFloat(amount) <= 0)) {
    return { isValid: false, error: "All token amounts must be greater than 0" };
  }

  // Check weights are valid
  if (formState.weights.some((weight) => !weight || parseFloat(weight) <= 0)) {
    return { isValid: false, error: "All weights must be greater than 0" };
  }

  // Check if weights sum to 100
  const totalWeight = formState.weights.reduce((sum, weight) => sum + parseFloat(weight || "0"), 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    return { isValid: false, error: `Weights must sum to 100%. Current total: ${totalWeight}%` };
  }

  // Check swap fee is valid
  if (parseFloat(formState.swapFee) <= 0 || parseFloat(formState.swapFee) > 10) {
    return { isValid: false, error: "Swap fee must be between 0 and 10%" };
  }

  return { isValid: true, error: null };
};
