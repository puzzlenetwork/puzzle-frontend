import React from "react";

import TokenSelectWithAddressInput from "@components/TokenSelectWithAddressInput/TokenSelectWithAddressInput";

import { Token } from "@entity/Token";

import { Input, InputContainer, InputLabel, RemoveTokenButton, TokenInputContainer } from "./PoolCreationStyles";

interface TokenInputProps {
  index: number;
  token: Token | null;
  amount: string;
  weight: string;
  onTokenChange: (token: Token | null) => void;
  onAmountChange: (amount: string) => void;
  onWeightChange: (weight: string) => void;
  canRemove: boolean;
  onRemove: () => void;
}

export const TokenInput: React.FC<TokenInputProps> = ({
  index,
  token,
  amount,
  weight,
  onTokenChange,
  onAmountChange,
  onWeightChange,
  canRemove,
  onRemove,
}) => {
  return (
    <TokenInputContainer>
      <InputContainer>
        <InputLabel>Token {index + 1}</InputLabel>
        <TokenSelectWithAddressInput
          placeholder="Enter token address or select token"
          value={token?.address || ""}
          onChange={onTokenChange}
        />
      </InputContainer>

      <InputContainer>
        <InputLabel>Amount</InputLabel>
        <Input
          placeholder="Enter token amount"
          type="text"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAmountChange(e.target.value)}
        />
      </InputContainer>

      <InputContainer>
        <InputLabel>Weight (%)</InputLabel>
        <Input
          max="100"
          min="0"
          placeholder="Enter weight percentage"
          step="0.01"
          type="number"
          value={weight}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onWeightChange(e.target.value)}
        />
      </InputContainer>

      {canRemove && <RemoveTokenButton onClick={onRemove}>Remove</RemoveTokenButton>}
    </TokenInputContainer>
  );
};
