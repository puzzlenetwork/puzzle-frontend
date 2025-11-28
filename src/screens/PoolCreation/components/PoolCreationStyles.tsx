import styled from "@emotion/styled";

import Button from "@components/Button";

export const Root = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const InputContainer = styled.div`
  width: 100%;
  margin-bottom: 16px;
`;

export const InputLabel = styled.div`
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const Input = styled.input`
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

export const TokenSelect = styled.select`
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

export const TokenInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.bgSecondary};
`;

export const RemoveTokenButton = styled(Button)`
  align-self: flex-start;
  width: fit-content;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.error};
  border-color: ${({ theme }) => theme.colors.error};

  &:hover {
    background: ${({ theme }) => theme.colors.errorHover};
  }
`;

export const ErrorContainer = styled.div`
  padding: 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.errorBg};
  color: ${({ theme }) => theme.colors.error};
  margin-bottom: 16px;
`;
