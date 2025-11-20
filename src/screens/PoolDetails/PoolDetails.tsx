import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "@emotion/styled";
import { observer } from "mobx-react";

import Button from "@components/Button";
import { Column, Row } from "@components/Flex";
import Text from "@components/Text";
import { media } from "@themes/breakpoints";

import { PoolDetails, PoolDetailsService } from "../../services/PoolDetailsService";

export const PoolDetailsPage: React.FC = observer(() => {
  const { poolAddress } = useParams<{ poolAddress: string }>();
  const navigate = useNavigate();
  const [poolDetails, setPoolDetails] = useState<PoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!poolAddress) {
      setError("Pool address not provided");
      setLoading(false);
      return;
    }

    const fetchPoolDetails = async () => {
      try {
        setLoading(true);
        const details = await PoolDetailsService.fetchPoolDetails(poolAddress);
        setPoolDetails(details);
        setError(null);
      } catch (err) {
        console.error("Error fetching pool details:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch pool details");
      } finally {
        setLoading(false);
      }
    };

    fetchPoolDetails();
  }, [poolAddress]);

  const shortenAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return (
      <PoolDetailsContainer>
        <Column alignItems="center" justifyContent="center" style={{ padding: "20px" }}>
          <Text type="BODY">Loading pool details...</Text>
        </Column>
      </PoolDetailsContainer>
    );
  }

  if (error) {
    return (
      <PoolDetailsContainer>
        <Column alignItems="center" justifyContent="center" style={{ padding: "20px" }}>
          <Text attention={true} type="BODY">
            Error: {error}
          </Text>
        </Column>
      </PoolDetailsContainer>
    );
  }

  if (!poolDetails) {
    return (
      <PoolDetailsContainer>
        <Column alignItems="center" justifyContent="center" style={{ padding: "20px" }}>
          <Text type="BODY">Pool details not found</Text>
        </Column>
      </PoolDetailsContainer>
    );
  }

  return (
    <PoolDetailsContainer>
      <HeaderRow>
        <div>
          <Text style={{ marginBottom: "8px" }} type="H">
            Pool Details
          </Text>
          <Text style={{ color: "#6c757d" }} type="BUTTON_SECONDARY" uppercase={true}>
            {shortenAddress(poolDetails.address)}
          </Text>
        </div>
        <Button grey={true} style={{ alignSelf: "flex-start", padding: "8px 16px" }} onClick={() => navigate("/pools")}>
          Back to Pools
        </Button>
      </HeaderRow>

      <PoolInfoCard>
        <Row
          justifyContent="space-between"
          style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #343541" }}
        >
          <div>
            <Text type="H">{poolDetails.name}</Text>
            <Text style={{ color: "#6c757d", marginTop: "4px" }} type="BUTTON_SECONDARY" uppercase={true}>
              {poolDetails.symbol}
            </Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <Text type="H">{poolDetails.totalSupply}</Text>
            <Text style={{ color: "#6c757d", marginTop: "4px" }} type="BUTTON_SECONDARY" uppercase={true}>
              Total Supply
            </Text>
          </div>
        </Row>

        <InfoSection>
          <Text style={{ marginBottom: "12px", textTransform: "uppercase" }} type="BUTTON">
            Pool Information
          </Text>

          <InfoRow>
            <InfoLabel>Pool Address</InfoLabel>
            <InfoValue>{shortenAddress(poolDetails.address)}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Pool ID</InfoLabel>
            <InfoValue>{shortenAddress(poolDetails.poolId)}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Owner</InfoLabel>
            <InfoValue>{shortenAddress(poolDetails.owner)}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Vault</InfoLabel>
            <InfoValue>{shortenAddress(poolDetails.vault)}</InfoValue>
          </InfoRow>
        </InfoSection>

        <InfoSection>
          <Text style={{ marginBottom: "12px", textTransform: "uppercase" }} type="BUTTON">
            Tokens
          </Text>

          {poolDetails.tokens.map((token, index) => (
            <TokenInfo key={index}>
              <TokenHeader>
                <Text type="BUTTON_SECONDARY">
                  Token {index}: {token.symbol}
                </Text>
              </TokenHeader>
              <InfoRow>
                <InfoLabel>Address</InfoLabel>
                <InfoValue>{shortenAddress(token.address)}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Name</InfoLabel>
                <InfoValue>{token.name}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Symbol</InfoLabel>
                <InfoValue>{token.symbol}</InfoValue>
              </InfoRow>
              <InfoRow>
                <InfoLabel>Decimals</InfoLabel>
                <InfoValue>{token.decimals}</InfoValue>
              </InfoRow>
            </TokenInfo>
          ))}
        </InfoSection>

        <InfoSection>
          <Text style={{ marginBottom: "12px", textTransform: "uppercase" }} type="BUTTON">
            Pool Parameters
          </Text>

          <InfoRow>
            <InfoLabel>Fee Tier</InfoLabel>
            <InfoValue>{poolDetails.feeTier}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Swap Fee Percentage</InfoLabel>
            <InfoValue>{poolDetails.swapFeePercentage}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Normalized Weights</InfoLabel>
            <InfoValue>{poolDetails.normalizedWeights.join(", ")}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Scaling Factors</InfoLabel>
            <InfoValue>{poolDetails.scalingFactors.join(", ")}</InfoValue>
          </InfoRow>
        </InfoSection>

        <InfoSection>
          <Text style={{ marginBottom: "12px", textTransform: "uppercase" }} type="BUTTON">
            Pool Statistics
          </Text>

          <InfoRow>
            <InfoLabel>Total Supply</InfoLabel>
            <InfoValue>{poolDetails.totalSupply}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Actual Supply</InfoLabel>
            <InfoValue>{poolDetails.actualSupply}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Total Liquidity</InfoLabel>
            <InfoValue>{poolDetails.totalLiquidity}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Invariant</InfoLabel>
            <InfoValue>{poolDetails.invariant}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Last Post Join/Exit Invariant</InfoLabel>
            <InfoValue>{poolDetails.lastPostJoinExitInvariant}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>Virtual Balances</InfoLabel>
            <InfoValue>{poolDetails.virtualBalances.join(", ")}</InfoValue>
          </InfoRow>
        </InfoSection>

        <InfoSection>
          <Text style={{ marginBottom: "12px", textTransform: "uppercase" }} type="BUTTON">
            Pool State
          </Text>

          <InfoRow>
            <InfoLabel>Paused</InfoLabel>
            <InfoValue>{poolDetails.paused ? "Yes" : "No"}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>In Recovery Mode</InfoLabel>
            <InfoValue>{poolDetails.inRecoveryMode ? "Yes" : "No"}</InfoValue>
          </InfoRow>

          <InfoRow>
            <InfoLabel>ATH Rate Product</InfoLabel>
            <InfoValue>{poolDetails.ATHRateProduct}</InfoValue>
          </InfoRow>
        </InfoSection>

        <InfoSection>
          <Text style={{ marginBottom: "12px", textTransform: "uppercase" }} type="BUTTON">
            Pool Transactions
          </Text>

          {poolDetails.transactions && poolDetails.transactions.length > 0 ? (
            poolDetails.transactions.map((tx, index) => (
              <TokenInfo key={index}>
                <InfoRow>
                  <InfoLabel>Transaction Hash</InfoLabel>
                  <InfoValue>{shortenAddress(tx.hash)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Type</InfoLabel>
                  <InfoValue style={{ textTransform: "capitalize" }}>{tx.type}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Amount</InfoLabel>
                  <InfoValue>{tx.amount}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>From</InfoLabel>
                  <InfoValue>{shortenAddress(tx.from)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>To</InfoLabel>
                  <InfoValue>{shortenAddress(tx.to)}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Timestamp</InfoLabel>
                  <InfoValue>{new Date(tx.timestamp).toLocaleString()}</InfoValue>
                </InfoRow>
              </TokenInfo>
            ))
          ) : (
            <Text style={{ textAlign: "center", padding: "10px" }} type="BODY">
              No transactions found for this pool
            </Text>
          )}
        </InfoSection>
      </PoolInfoCard>
    </PoolDetailsContainer>
  );
});

const HeaderRow = styled(Row)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  width: 100%;

  ${media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const PoolDetailsContainer = styled(Column)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;

  ${media.mobile} {
    padding: 8px;
  }
`;

const PoolInfoCard = styled.div`
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderPrimary};
  border-radius: 10px;
  padding: 20px;
  width: 100%;
`;

const InfoSection = styled.div`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSecondary};

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const InfoRow = styled(Row)`
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 0;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.div`
  flex: 1;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const InfoValue = styled.div`
  flex: 1;
  text-align: right;
  color: ${({ theme }) => theme.colors.textPrimary};
  word-break: break-all;
`;

const TokenInfo = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background-color: ${({ theme }) => theme.colors.bgTertiary};
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TokenHeader = styled.div`
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSecondary};
`;
