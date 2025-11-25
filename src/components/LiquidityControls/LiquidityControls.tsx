import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { getPublicClient } from "@wagmi/core";
import { observer } from "mobx-react-lite";
import { getContract } from "viem";
import { useAccount } from "wagmi";

import Button from "@components/Button";
import { Column, Row } from "@components/Flex";
import Text from "@components/Text";
import TokenInput from "@components/TokenInput";

import { useStores } from "@stores/useStores";

import BN from "@utils/BN";

import { RANGE_POOL_ABI } from "../../abi/rangePoolABI";
import { LiquidityService, TokenAmount } from "../../services/LiquidityService";

// Complete ERC20 ABI with approve function
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
] as const;

interface LiquidityControlsProps {
  poolAddress: string;
  poolId: string;
  tokens: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  }[];
}

const LiquidityControls: React.FC<LiquidityControlsProps> = observer(({ poolAddress, poolId, tokens }) => {
  const { accountStore, notificationStore } = useStores();
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"provide" | "withdraw">("provide");
  const [tokenAmounts, setTokenAmounts] = useState<TokenAmount[]>([]);
  const [bptAmount, setBptAmount] = useState<BN>(new BN(0));
  const [userPoolShare, setUserPoolShare] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);

  // Initialize token amounts when tokens change
  useEffect(() => {
    if (tokens.length > 0) {
      const initialAmounts = tokens.map((token) => ({
        tokenAddress: token.address,
        amount: "0",
        decimals: token.decimals,
      }));
      setTokenAmounts(initialAmounts);
    }
  }, [tokens]);

  // Get user's pool share when connected
  useEffect(() => {
    if (isConnected && accountStore.address) {
      const fetchPoolShare = async () => {
        try {
          const share = await LiquidityService.getPoolShare(poolAddress, accountStore.address!);
          setUserPoolShare(share);
        } catch (error) {
          console.error("Error fetching pool share:", error);
        }
      };
      fetchPoolShare();
    }
  }, [isConnected, accountStore.address, poolAddress]);

  const handleTokenAmountChange = (index: number, amount: BN) => {
    const newTokenAmounts = [...tokenAmounts];
    newTokenAmounts[index] = {
      ...newTokenAmounts[index],
      amount: amount.toString(),
    };
    setTokenAmounts(newTokenAmounts);
  };

  const handleBptAmountChange = (amount: BN) => {
    setBptAmount(amount);
  };

  const handleMaxTokenAmount = async (index: number) => {
    if (!accountStore.address) return;

    const token = tokens[index];
    const publicClient = getPublicClient(accountStore.wagmiConfig!);
    if (!publicClient) return;

    try {
      const tokenContract = getContract({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        client: publicClient,
      });

      const balance = (await tokenContract.read.balanceOf([accountStore.address])) as bigint;
      const balanceString = balance.toString();

      const newTokenAmounts = [...tokenAmounts];
      newTokenAmounts[index] = {
        ...newTokenAmounts[index],
        amount: balanceString,
      };
      setTokenAmounts(newTokenAmounts);
    } catch (error) {
      console.error(`Error getting balance for token ${token.symbol}:`, error);
      notificationStore.error({ text: `Error getting balance for ${token.symbol}` });
    }
  };

  const handleMaxBptAmount = async () => {
    if (!accountStore.address) return;

    const publicClient = getPublicClient(accountStore.wagmiConfig!);
    if (!publicClient) return;

    try {
      const poolContract = getContract({
        address: poolAddress as `0x${string}`,
        abi: RANGE_POOL_ABI,
        client: publicClient,
      });

      const balance = (await poolContract.read.balanceOf([accountStore.address])) as bigint;
      setBptAmount(new BN(balance.toString()));
    } catch (error) {
      console.error("Error getting pool token balance:", error);
      notificationStore.error({ text: "Error getting pool token balance" });
    }
  };

  const handleProvideLiquidity = async () => {
    if (!isConnected) {
      notificationStore.info({ text: "Please connect your wallet first" });
      return;
    }

    if (tokenAmounts.some((ta) => parseFloat(ta.amount) <= 0)) {
      notificationStore.info({ text: "Please enter valid amounts for all tokens" });
      return;
    }

    setLoading(true);
    try {
      // Get current pool tokens to match addresses
      const poolTokens = await LiquidityService.getPoolTokens(poolAddress, poolId);

      // Get actual vault address for approval
      const publicClient = getPublicClient(accountStore.wagmiConfig!);
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      const vaultAddress = (await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: RANGE_POOL_ABI,
        functionName: "getVault",
      })) as string;

      // Approve tokens for vault
      setApproving(true);
      const approvalHashes = await LiquidityService.approveTokensForVault(
        poolTokens.tokens,
        vaultAddress,
        tokenAmounts.map((ta) => ta.amount),
        poolTokens.decimals,
        accountStore.wagmiConfig!,
      );

      if (approvalHashes.length > 0) {
        notificationStore.info({ text: "Approving tokens..." });
        // Wait for approvals to complete
        for (const hash of approvalHashes) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
      }
      setApproving(false);

      // Execute join pool
      notificationStore.info({ text: "Providing liquidity..." });

      // Execute join pool using the LiquidityService
      await LiquidityService.joinPool(
        poolId,
        poolTokens.tokens,
        tokenAmounts.map((ta) => ta.amount),
        "0", // minBptAmount - should calculate based on slippage
        accountStore.address!,
        accountStore.address!,
        false, // fromInternalBalance
        accountStore.wagmiConfig!,
      );

      notificationStore.success({ text: "Liquidity provided successfully!" });
    } catch (error) {
      console.error("Error providing liquidity:", error);
      notificationStore.error({
        text: `Error providing liquidity: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setLoading(false);
      setApproving(false);
    }
  };

  const handleWithdrawLiquidity = async () => {
    if (!isConnected) {
      notificationStore.info({ text: "Please connect your wallet first" });
      return;
    }

    if (bptAmount.lte(0)) {
      notificationStore.info({ text: "Please enter a valid BPT amount" });
      return;
    }

    setLoading(true);
    try {
      notificationStore.info({ text: "Withdrawing liquidity..." });

      // Get current pool tokens
      const poolTokens = await LiquidityService.getPoolTokens(poolAddress, poolId);

      // Get the total supply to calculate proportional amounts
      const publicClient = getPublicClient(accountStore.wagmiConfig!);
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      const totalSupply = (await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: RANGE_POOL_ABI,
        functionName: "totalSupply",
      })) as bigint;
      const userBptAmount = BigInt(bptAmount.toString());

      // Validate that user doesn't try to withdraw more than they own
      const userBalance = (await publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: RANGE_POOL_ABI,
        functionName: "balanceOf",
        args: [accountStore.address as `0x${string}`],
      })) as bigint;

      if (userBptAmount > userBalance) {
        throw new Error("Cannot withdraw more than your pool balance");
      }

      // Calculate proportional amounts based on user's BPT share
      const amounts = poolTokens.balances.map((balanceStr) => {
        const balance = BigInt(balanceStr);
        // Calculate the portion: (userBptAmount / totalSupply) * balance
        if (totalSupply === 0n) return "0";
        const amount = (userBptAmount * balance) / totalSupply;
        return amount.toString();
      });

      // Execute exit pool using the LiquidityService
      await LiquidityService.exitPool(
        poolId,
        poolTokens.tokens,
        amounts,
        bptAmount.toString(),
        accountStore.address!,
        accountStore.address!,
        false, // toInternalBalance
        accountStore.wagmiConfig!,
      );

      notificationStore.success({ text: "Liquidity withdrawn successfully!" });
    } catch (error) {
      console.error("Error withdrawing liquidity:", error);
      notificationStore.error({
        text: `Error withdrawing liquidity: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LiquidityContainer>
      <TabsContainer>
        <TabButton active={activeTab === "provide"} onClick={() => setActiveTab("provide")}>
          <Text type={activeTab === "provide" ? "BUTTON" : "BUTTON_SECONDARY"}>Provide Liquidity</Text>
        </TabButton>
        <TabButton active={activeTab === "withdraw"} onClick={() => setActiveTab("withdraw")}>
          <Text type={activeTab === "withdraw" ? "BUTTON" : "BUTTON_SECONDARY"}>Withdraw Liquidity</Text>
        </TabButton>
      </TabsContainer>

      {activeTab === "provide" && (
        <ProvideLiquidityContainer>
          <Text style={{ marginBottom: "16px" }} type="H">
            Add Liquidity
          </Text>

          {tokenAmounts.map((tokenAmount, index) => {
            const token = tokens[index];
            return (
              <TokenInput
                key={index}
                amount={new BN(tokenAmount.amount || 0)}
                decimals={token.decimals}
                handleMaxBalance={() => handleMaxTokenAmount(index)}
                isShowMax={true}
                label={`${token.name} (${token.symbol})`}
                setAmount={(amount) => handleTokenAmountChange(index, amount)}
                symbol={token.symbol}
              />
            );
          })}

          <Button disabled={loading || !isConnected} style={{ marginTop: "16px" }} onClick={handleProvideLiquidity}>
            {approving ? "Approving..." : loading ? "Processing..." : "Provide Liquidity"}
          </Button>
        </ProvideLiquidityContainer>
      )}

      {activeTab === "withdraw" && (
        <WithdrawLiquidityContainer>
          <Text style={{ marginBottom: "16px" }} type="H">
            Remove Liquidity
          </Text>

          <Text style={{ marginBottom: "8px" }} type="BODY">
            Your pool share: {userPoolShare}%
          </Text>

          <TokenInput
            amount={bptAmount}
            decimals={18}
            handleMaxBalance={handleMaxBptAmount}
            isShowMax={true}
            label="LP Tokens"
            setAmount={handleBptAmountChange}
            symbol="BPT"
          />

          <Button disabled={loading || !isConnected} style={{ marginTop: "16px" }} onClick={handleWithdrawLiquidity}>
            {loading ? "Processing..." : "Withdraw Liquidity"}
          </Button>
        </WithdrawLiquidityContainer>
      )}
    </LiquidityContainer>
  );
});

export default LiquidityControls;

const LiquidityContainer = styled(Column)`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderPrimary};
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
`;

const TabsContainer = styled(Row)`
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSecondary};
  margin-bottom: 16px;
`;

const TabButton = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  border-bottom: 2px solid ${(props) => (props.active ? props.theme.colors.textPrimary : "transparent")};
  color: ${(props) => (props.active ? props.theme.colors.textPrimary : props.theme.colors.textSecondary)};
  font-weight: ${(props) => (props.active ? "bold" : "normal")};
  flex: 1;
  text-align: center;
`;

const ProvideLiquidityContainer = styled(Column)`
  width: 100%;
`;

const WithdrawLiquidityContainer = styled(Column)`
  width: 100%;
`;
