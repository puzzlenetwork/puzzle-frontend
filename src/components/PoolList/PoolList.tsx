import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "@emotion/styled";
import { observer } from "mobx-react";

import { Column, Row } from "@components/Flex";
import Text from "@components/Text";
import { media } from "@themes/breakpoints";

import { PoolDetails, PoolDetailsService } from "../../services/PoolDetailsService";
import PoolListService from "../../services/PoolListService";

interface PoolData {
  poolAddress: string;
  blockNumber: number;
  transactionHash: string;
  name: string;
  symbol: string;
  totalSupply: string;
  tokens: TokenInfo[];
}

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const PoolList: React.FC = observer(() => {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [poolDetails, setPoolDetails] = useState<Record<string, PoolDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);

        // Load full pool data from preloaded JSON file using PoolListService
        const fullPoolData = await PoolListService.getPoolsData();
        setPools(fullPoolData);
        setError(null);

        // Fetch additional details for each pool
        if (fullPoolData.length > 0) {
          const poolAddresses = fullPoolData.map((pool) => pool.poolAddress);
          const details = await PoolDetailsService.fetchMultiplePoolDetails(poolAddresses);

          // Convert details array to a map for easier lookup
          const detailsMap: Record<string, PoolDetails> = {};
          details.forEach((detail) => {
            detailsMap[detail.address] = detail;
          });

          setPoolDetails(detailsMap);
        }
      } catch (err) {
        console.error("Error fetching pool events:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch pool events");
      } finally {
        setLoading(false);
      }
    };

    // Fetch pools
    fetchPools();
  }, []);

  const shortenAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const shortenTxHash = (hash: string) => {
    if (hash.length < 15) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  return (
    <PoolListContainer>
      <Text style={{ marginBottom: "16px" }} type="H">
        Pool List
      </Text>

      {loading && (
        <Column alignItems="center" justifyContent="center" style={{ padding: "20px" }}>
          <Text type="BODY">Loading pools...</Text>
        </Column>
      )}

      {error && (
        <Column alignItems="center" justifyContent="center" style={{ padding: "20px" }}>
          <Text attention={true} type="BODY">
            Error: {error}
          </Text>
        </Column>
      )}

      {!loading && !error && pools.length === 0 && (
        <Column alignItems="center" justifyContent="center" style={{ padding: "20px" }}>
          <Text type="BODY">No pools found</Text>
        </Column>
      )}

      {!loading && !error && pools.length > 0 && (
        <PoolsTable>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <Text type="BUTTON_SECONDARY" uppercase={true}>
                  Pool Address
                </Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text type="BUTTON_SECONDARY" uppercase={true}>
                  Token Symbols
                </Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text type="BUTTON_SECONDARY" uppercase={true}>
                  Total Supply
                </Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text type="BUTTON_SECONDARY" uppercase={true}>
                  Fee Tier
                </Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text type="BUTTON_SECONDARY" uppercase={true}>
                  Current Price
                </Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text type="BUTTON_SECONDARY" uppercase={true}>
                  Block Number
                </Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text type="BUTTON_SECONDARY" uppercase={true}>
                  Transaction Hash
                </Text>
              </TableHeaderCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pools.map((pool, index) => {
              const details = poolDetails[pool.poolAddress] || null;
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Text
                      nowrap={true}
                      pointer={true}
                      primary={true}
                      style={{ cursor: "pointer", textDecoration: "underline" }}
                      type="BODY"
                      onClick={() => navigate(`/pool/${pool.poolAddress}`)}
                    >
                      {shortenAddress(pool.poolAddress)}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text nowrap={true} primary={true} type="BODY">
                      {pool.tokens && pool.tokens.length > 0
                        ? pool.tokens.map((token) => token.symbol).join(", ")
                        : details && details.tokens && details.tokens.length > 0
                          ? details.tokens.map((token) => token.symbol).join(", ")
                          : "Loading..."}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text nowrap={true} primary={true} type="BODY">
                      {pool.totalSupply || "N/A"}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text primary={true} type="BODY">
                      {details ? details.feeTier : "Loading..."}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text primary={true} type="BODY">
                      {details ? details.currentPrice : "Loading..."}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text primary={true} type="BODY">
                      {pool.blockNumber}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text nowrap={true} primary={true} type="BODY">
                      {shortenTxHash(pool.transactionHash)}
                    </Text>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </PoolsTable>
      )}
    </PoolListContainer>
  );
});

const PoolListContainer = styled(Column)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;

  ${media.mobile} {
    padding: 8px;
  }
`;

const PoolsTable = styled.div`
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.bgSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderPrimary};
`;

const TableHeader = styled.div`
  background-color: ${({ theme }) => theme.colors.bgSecondary};
`;

const TableBody = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const TableRow = styled(Row)`
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSecondary};
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
`;

const TableHeaderCell = styled.div`
  flex: 0.8;
  padding: 8px 0;
  min-width: 80px;
`;

const TableCell = styled.div`
  flex: 0.8;
  padding: 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 80px;
`;
