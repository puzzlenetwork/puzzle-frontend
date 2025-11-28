import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { observer } from "mobx-react";
import { useBalance } from "wagmi";

import { ConnectWalletButton } from "@components/ConnectWalletButton";
import { AssetBlockData } from "@components/SelectAssets/SelectAssetsInput";
import { SmartFlex } from "@components/SmartFlex";
import Text, { TEXT_TYPES_MAP } from "@components/Text";
import { media } from "@themes/breakpoints";

import ArrowDownIcon from "@assets/icons/arrowDown.svg?react";
import Spinner from "@assets/icons/spinner.svg?react";

import { useMedia } from "@hooks/useMedia";
import { useWallet } from "@hooks/useWallet";
import { useStores } from "@stores";

import BN from "@utils/BN";
import { isValidAmountInput, parseNumberWithCommas, replaceComma } from "@utils/swapUtils";

import { Token } from "@entity";

import SwapButtonSkeletonWrapper from "../../components/Skeletons/SwapButtonSkeletonWrapper";
import SwapSkeletonWrapper from "../../components/Skeletons/SwapSkeletonWrapper";

import { BalanceSection } from "./BalanceSection";
import { InfoBlock } from "./InfoBlock";
import { TokenSelect } from "./TokenSelect";

export const SwapScreen: React.FC = observer(() => {
  const { swapStore, accountStore, oracleStore, balanceStore } = useStores();
  const { isConnected } = useWallet();
  const media = useMedia();
  const { data } = useBalance({ address: accountStore.address });
  const ethBalance = new BN(data?.formatted ?? "0");
  const tokens = swapStore.tokens;

  // Get pool address from URL params
  const { poolAddress } = useParams<{ poolAddress: string }>();

  // State to track if tokens have been loaded for the pool
  const [isPoolTokensLoaded, setIsPoolTokensLoaded] = useState(!poolAddress); // If no poolAddress, consider loaded
  const [poolTokensAddresses, setPoolTokensAddresses] = useState<string[]>([]);

  // Effect to handle pool-specific token selection
  useEffect(() => {
    if (poolAddress && tokens.length > 0) {
      // Set tokens based on the pool address only after tokens are loaded
      swapStore.setTokensForPool(poolAddress).then((poolTokenAddresses) => {
        // Get the pool tokens addresses to filter the selection dropdown
        if (poolTokenAddresses && poolTokenAddresses.length > 0) {
          setPoolTokensAddresses(poolTokenAddresses);
        } else if (swapStore.poolData) {
          setPoolTokensAddresses(swapStore.poolData.tokens);
        }
        setIsPoolTokensLoaded(true);
      });
    } else {
      setIsPoolTokensLoaded(true);
      setPoolTokensAddresses([]); // Reset for general swap
    }
  }, [poolAddress, tokens, swapStore]);

  // If we're in a pool-specific context, wait until tokens are loaded
  if (poolAddress && !isPoolTokensLoaded) {
    return (
      <Root>
        <Text type="H">Loading pool tokens...</Text>
      </Root>
    );
  }

  const sellTokenBalance = new BN(balanceStore.balances[swapStore.sellToken.assetId]?.balance ?? 0);
  const buyTokenBalance = new BN(balanceStore.balances[swapStore.buyToken.assetId]?.balance ?? 0);

  const buyTokenPrice = oracleStore.getTokenIndexPrice(swapStore.buyToken.priceFeed);
  const sellTokenPrice = oracleStore.getTokenIndexPrice(swapStore.sellToken.priceFeed);

  // Проверяем, достаточно ли баланса для совершения сделки
  const payAmountBN = new BN(swapStore.payAmount || "0");
  const hasInsufficientBalance = payAmountBN.gt(0) && sellTokenBalance.lt(payAmountBN);

  // Проверяем, равна ли сумма продажи нулю
  const isSellAmountZero = payAmountBN.eq(0);

  // Функция для определения текста кнопки
  const getButtonText = () => {
    if (swapStore.isApproving) {
      return "Approving...";
    }

    if (swapStore.isSwapping) {
      return "Swapping...";
    }

    if (swapStore.isLoading) {
      return "Processing";
    }

    if (hasInsufficientBalance) {
      return "Insufficient fee balance";
    }

    if (isSellAmountZero) {
      return "Swap";
    }

    return `Swap ${swapStore.sellToken.symbol} to ${swapStore.buyToken.symbol}`;
  };

  // Функция для определения состояния disabled кнопки
  const isButtonDisabled = () => {
    if (!isConnected) return true;
    if (swapStore.isLoading) return true;
    if (isSellAmountZero) return true;
    return false;
  };

  const receiveAmountUSD = buyTokenPrice
    ? buyTokenPrice.times(parseNumberWithCommas(swapStore.receiveAmount)).toSignificant(2).toString()
    : "-";

  const sellAmountUSD =
    sellTokenPrice && sellTokenPrice.gt(0)
      ? sellTokenPrice.times(parseNumberWithCommas(swapStore.payAmount)).toSignificant(2).toString()
      : "-";

  const dataOnboardingSwapKey = `swap-${media.mobile ? "mobile" : "desktop"}`;

  const generateBalanceData = (assets: Token[]): AssetBlockData[] => {
    if (poolAddress && poolTokensAddresses.length > 0) {
      // If we're in a pool-specific context, only show tokens that are part of this pool
      return accountStore.formattedBalanceInfoList.filter(
        (el) =>
          assets.some((item) => item.assetId === el.assetId) &&
          poolTokensAddresses.some((token) => token.toLowerCase() === el.asset.address?.toLowerCase()),
      );
    } else {
      // For general swap, show all available tokens from all pools and account store
      // Include tokens even if user doesn't have a balance (balance will show as 0)
      const allTokenAssets = assets.map((token) => {
        const balanceInfo = accountStore.formattedBalanceInfoList.find((el) => el.assetId === token.assetId);

        if (balanceInfo) {
          return balanceInfo;
        } else {
          // Create a default asset block with 0 balance for tokens without balance
          return {
            assetId: token.assetId,
            asset: token,
            balance: "0",
            price: oracleStore.getTokenIndexPrice(token.priceFeed)?.toString() || "-",
          };
        }
      });

      return allTokenAssets;
    }
  };

  const onPayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (swapStore.isLoading) return;
    const newPayAmount = replaceComma(e.target.value);

    if (!isValidAmountInput(newPayAmount)) return;

    swapStore.setPayAmount(newPayAmount);
  };

  // const onReceivedTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (swapStore.isLoading) return;
  //   const newReceiveAmount = replaceComma(e.target.value);

  //   if (!isValidAmountInput(newReceiveAmount)) return;

  //   swapStore.setReceiveAmount(newReceiveAmount);
  // };

  const fillSellAmount = () => {
    const balance = sellTokenBalance.toString();
    const newPayAmount = parseNumberWithCommas(balance).toFixed(swapStore.sellToken.decimals);
    swapStore.setPayAmount(newPayAmount);
  };

  const isLoaded = isConnected; //todo: && balanceStore.initialized;

  return (
    <Root>
      <Text>
        <Title>Trade Within Ranges</Title>
        <Text style={{ textAlign: "center" }} type="BUTTON">
          Swap one token for another directly inside the defined liquidity ranges.
        </Text>
      </Text>
      {/* <InfoIcon src={infoIcon} alt="info" onClick={() => setShowInfo(true)} /> */}

      <SwapSkeletonWrapper isReady={true}>
        <SwapContainer>
          <SwapBox>
            <BoxHeader>
              <ActionContainer>
                <Text type="TEXT">Sell</Text>
              </ActionContainer>
              <TokenSelect
                assets={generateBalanceData(tokens)}
                selectedOption={generateBalanceData([swapStore.sellToken])[0]}
                showBalance="balance"
                type="rounded"
                onSelect={(item) => swapStore.setSellToken(item.asset)}
              />
            </BoxHeader>
            <SwapInput
              autoComplete="off"
              id="pay-amount"
              type="text"
              value={swapStore.payAmount}
              onChange={onPayAmountChange}
            />
            {isLoaded && ethBalance.gt(0) && (
              <BalanceSection
                balance={sellTokenBalance.toSignificant(4).toString()}
                balanceUSD={sellAmountUSD}
                handleMaxAmount={fillSellAmount}
                isLoaded={isLoaded}
              />
            )}
          </SwapBox>

          <SwitchTokens disabled={false} isLoaded={isLoaded} onClick={swapStore.onSwitchTokens}>
            <ArrowDownIcon />
          </SwitchTokens>

          <SwapBox>
            <BoxHeader>
              <Text type="TEXT">Buy</Text>
              <TokenSelect
                assets={generateBalanceData(tokens)}
                selectedOption={generateBalanceData([swapStore.buyToken])[0]}
                showBalance="balance"
                type="rounded"
                onSelect={(item) => swapStore.setBuyToken(item.asset)}
              />
            </BoxHeader>
            <SwapInput
              autoComplete="off"
              id="receive-amount"
              type="text"
              value={swapStore.receiveAmount}
              readOnly
              // onChange={onReceivedTokensChange}
            />
            {isLoaded && ethBalance.gt(0) && (
              <BalanceSection
                balance={buyTokenBalance.toSignificant(4).toString()}
                balanceUSD={receiveAmountUSD}
                handleMaxAmount={() => {}}
                isLoaded={isLoaded}
              />
            )}
          </SwapBox>
        </SwapContainer>
      </SwapSkeletonWrapper>
      <InfoBlock />
      <SwapButtonSkeletonWrapper isReady={true}>
        <SmartFlexStyled>
          <ConnectWalletButtonStyled connectText="Connect wallet to start trading" targetKey="swap_connect_btn">
            <SwapButton
              data-onboarding={dataOnboardingSwapKey}
              disabled={isButtonDisabled()}
              onClick={swapStore.swapTokens}
            >
              <Text type="BUTTON_BIG">
                {swapStore.isLoading || swapStore.isApproving || swapStore.isSwapping ? (
                  <>
                    <Spinner height={14} /> {getButtonText()}
                  </>
                ) : (
                  getButtonText()
                )}
              </Text>
            </SwapButton>
          </ConnectWalletButtonStyled>
        </SmartFlexStyled>
      </SwapButtonSkeletonWrapper>
      {/* <RangeChart assetsWithLeverage={swapStore.assetsWithLeverage} size={120} /> */}
    </Root>
  );
});

const Root = styled.div`
  padding-top: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 16px;
  position: relative;
  width: 400px;

  ${media.mobile} {
    width: 100%;
    padding: 0 8px;
    margin-top: 42px;
  }
`;

const SmartFlexStyled = styled(SmartFlex)`
  width: 100%;
  ${media.mobile} {
    position: fixed;
    bottom: 40px;
    width: calc(100% - 16px);
  }
`;
const textAnimation = keyframes`
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
`;

const ConnectWalletButtonStyled = styled(ConnectWalletButton)`
  ${TEXT_TYPES_MAP.BUTTON_BIG}
  border-radius: 10px;
  padding: 12px 16px !important;
  height: 56px !important;
`;
const Title = styled.h1`
  /* width: 70px; */
  font-size: 28px !important;
  line-height: 1 !important;
  font-weight: 500;
  text-align: center;
  background: linear-gradient(to right, #fff, #ff9b57, #54bb94);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${textAnimation} 3s infinite;
  background-size: 300% 300%;
  color: transparent;
  margin: 0 auto 8px;
`;

const SwapContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SwapBox = styled.div`
  border-radius: 4px 4px 10px 10px;
  background-color: #232323;
  padding: 16px 20px;
  &:first-of-type {
    margin-bottom: 4px;
    border-radius: 10px 10px 4px 4px;
  }
`;

const BoxHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  margin-right: -12px;
  height: 25px;
`;

const ActionContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

// const ActionTag = styled(Button)<{ onPress: boolean }>`
//   padding: 5px !important;
//   height: auto !important;
//   width: auto !important;
//   background: ${({ onPress }) => (onPress ? "#535353" : "#53535326")};
//   border: none;
//   border-radius: 4px;
//   ${Text} {
//     color: ${({ theme, onPress }) => (onPress ? "white" : theme.colors.textSecondary)};
//   }
//   &:hover {
//     background: ${({ theme }) => theme.colors.textDisabled};
//     ${Text} {
//       color: ${({ theme }) => theme.colors.textPrimary};
//     }
//   }
// `;

const SwapInput = styled.input`
  border: none;
  width: 100%;
  background: transparent;
  outline: none;
  color: white;

  ${TEXT_TYPES_MAP.H_NUMBERS}

  ${media.mobile} {
    font-size: 24px;
  }
`;

const SwitchTokens = styled.button<{ disabled: boolean; isLoaded: boolean }>`
  outline: none;
  border: none;
  position: absolute;
  left: calc(50% - 14px);
  top: ${({ isLoaded }) => (isLoaded ? "112px" : "100px")}; // TODO: height of first section, check for mobile
  background-color: ${({ theme }) => theme.colors.greenLight};
  width: 28px;
  height: 44px;
  border-radius: 22px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow:
    0px 1px 1px 0px rgba(255, 255, 255, 0.77) inset,
    0px 2px 5px 0px rgba(0, 0, 0, 0.22),
    0px 16px 14px -6px rgba(21, 20, 21, 0.25),
    0px 1px 1px 0px rgba(255, 255, 255, 0.17) inset;
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  background-color: ${({ theme, disabled }) => (disabled ? theme.colors.borderSecondary : theme.colors.greenLight)};
  color: ${({ theme, disabled }) => (disabled ? theme.colors.iconDisabled : "#171717")};
  transition:
    border-radius 0.2s,
    transform 0.2s;

  &:hover {
    transform: scale(1.1);
    background: #2effab;
  }

  &:active {
    background-color: #6effc5;
  }

  svg {
    fill: ${({ theme, disabled }) => (disabled ? theme.colors.iconDisabled : "#171717")};
    transition:
      background-color 0.2s,
      transform 0.2s;
  }
`;

const SwapButton = styled.button`
  outline: none;
  border-radius: 16px;
  cursor: pointer;
  width: 100%;
  height: 56px;
  border: 1px solid ${({ theme }) => theme.colors.greenLight};
  background-color: ${({ theme }) => theme.colors.greenDark};
  transition: all 0.2s;
  padding: 16px 0;
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  ${Text} {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
  &:disabled {
    ${Text} {
      color: ${({ theme }) => theme.colors.textDisabled};
    }
    background-color: ${({ theme }) => theme.colors.borderSecondary};
    border: 1px solid ${({ theme }) => theme.colors.borderSecondary};
  }

  &:hover,
  &:active {
    background-color: ${({ theme }) => theme.colors.greenMediumOld};
  }
`;
