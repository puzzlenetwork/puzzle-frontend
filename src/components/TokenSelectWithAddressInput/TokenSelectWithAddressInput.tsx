import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";

import { SepoliaTokenConfig, TOKEN_TYPE, TOKENS, TTokenConfig } from "@constants/tokenConfig";

import { Token } from "@entity/Token";

interface TokenSelectWithAddressInputProps {
  value: string;
  onChange: (token: Token | null) => void;
  placeholder?: string;
}

const TokenSelectWithAddressInput: React.FC<TokenSelectWithAddressInputProps> = ({
  value,
  onChange,
  placeholder = "Enter token address or select token",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredTokens, setFilteredTokens] = useState<TTokenConfig[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter tokens based on input
  useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredTokens(Object.values(SepoliaTokenConfig).filter((token) => token.type === TOKEN_TYPE.ERC20));
      setIsDropdownOpen(true);
    } else {
      const tokens = Object.values(SepoliaTokenConfig).filter(
        (token) =>
          token.type === TOKEN_TYPE.ERC20 &&
          (token.name.toLowerCase().includes(inputValue.toLowerCase()) ||
            token.symbol.toLowerCase().includes(inputValue.toLowerCase()) ||
            (token as any).address.toLowerCase().includes(inputValue.toLowerCase())),
      );
      setFilteredTokens(tokens);
      setIsDropdownOpen(tokens.length > 0);
    }
  }, [inputValue]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Check if the input is a valid address format
    if (/^0x[a-fA-F0-9]{40}$/.test(newValue)) {
      // Create a custom token with the provided address
      const customTokenConfig: TTokenConfig = {
        type: TOKEN_TYPE.ERC20,
        symbol: TOKENS.VOV, // Use a default token symbol
        name: "Custom Token",
        decimals: 18,
        address: newValue as `0x${string}`,
      };
      const customToken = new Token(customTokenConfig);
      onChange(customToken);
    } else {
      // If not a valid address, set to null
      onChange(null);
    }
  };

  const handleTokenSelect = (tokenConfig: TTokenConfig) => {
    if (tokenConfig.type === TOKEN_TYPE.ERC20) {
      const token = new Token(tokenConfig);
      setInputValue(tokenConfig.address);
      onChange(token);
      setIsDropdownOpen(false);
    }
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  return (
    <Container ref={containerRef}>
      <Input
        placeholder={placeholder}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
      />
      {isDropdownOpen && (
        <Dropdown>
          {filteredTokens.map((token, index) => (
            <DropdownItem key={index} onClick={() => handleTokenSelect(token)}>
              {token.name} ({token.symbol}) - {(token as any).address}
            </DropdownItem>
          ))}
        </Dropdown>
      )}
    </Container>
  );
};

export default TokenSelectWithAddressInput;

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSecondary};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.bgSecondary};
  margin-top: 4px;
`;

const DropdownItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;

  &:hover {
    background: ${({ theme }) => theme.colors.bgTertiary};
  }
`;
