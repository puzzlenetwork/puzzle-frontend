import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { getPublicClient } from "@wagmi/core";
import { observer } from "mobx-react";
import { useAccount } from "wagmi";

import { Column, Row } from "@components/Flex";
import Text from "@components/Text";
import { media } from "@themes/breakpoints";

import { wagmiConfig } from "@constants/wagmiConfig";

import { PoolDetails, PoolDetailsService } from "../../services/PoolDetailsService";
import rangePoolFactoryService from "../../services/rangePoolFactoryService";

interface PoolCreatedEvent {
  pool: string;
  blockNumber: number;
  transactionHash: string;
}

export const PoolList: React.FC = observer(() => {
  const { isConnected } = useAccount();
  const [pools, setPools] = useState<PoolCreatedEvent[]>([]);
  const [poolDetails, setPoolDetails] = useState<Record<string, PoolDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        const publicClient = getPublicClient(wagmiConfig);
        if (!publicClient) {
          throw new Error("Public client not available");
        }

        await rangePoolFactoryService.initialize(publicClient);
        const poolEvents = await rangePoolFactoryService.fetchAllPoolCreatedEvents();
        setPools(poolEvents);
        setError(null);

        // Fetch additional details for each pool
        if (poolEvents.length > 0) {
          const poolAddresses = poolEvents.map((pool) => pool.pool);
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

    // Fetch pools regardless of connection status
    fetchPools();
  }, [isConnected]);

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
                  Token 0
                </Text>
              </TableHeaderCell>
              <TableHeaderCell>
                <Text type="BUTTON_SECONDARY" uppercase={true}>
                  Token 1
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
              const details = poolDetails[pool.pool] || null;
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Text nowrap={true} primary={true} type="BODY">
                      {shortenAddress(pool.pool)}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text nowrap={true} primary={true} type="BODY">
                      {details ? details.token0 : "Loading..."}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text nowrap={true} primary={true} type="BODY">
                      {details ? details.token1 : "Loading..."}
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
