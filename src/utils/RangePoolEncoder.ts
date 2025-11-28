import { encodeAbiParameters } from "viem";

// Define the join kind enum
const RangePoolJoinKind = {
  INIT: 0,
  EXACT_TOKENS_IN_FOR_BPT_OUT: 1,
  TOKEN_IN_FOR_EXACT_BPT_OUT: 2,
  ALL_TOKENS_IN_FOR_EXACT_BPT_OUT: 3,
  ADD_TOKEN: 4,
} as const;

// Create the RangePoolEncoder class
export class RangePoolEncoder {
  /**
   * Encodes the userData parameter for providing the initial liquidity to a Range Pool
   * @param amountsIn - the amounts of tokens to send to the pool to form the initial balances
   * @param vBalances - the virtual balances for pool calculations
   * @returns ABI-encoded userData for the joinPool function
   */
  static joinInit = (amountsIn: bigint[], vBalances: bigint[]): `0x${string}` => {
    return encodeAbiParameters(
      [{ type: "uint256" }, { type: "uint256[]" }, { type: "uint256[]" }],
      [BigInt(RangePoolJoinKind.INIT), amountsIn, vBalances],
    );
  };
}

export { RangePoolJoinKind };
