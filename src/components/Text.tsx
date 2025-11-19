import { css } from "@emotion/react";
import styled from "@emotion/styled";

import { TEXT_TYPES_MAP, TextProps } from "./Text/types";

const Text = styled.div<TextProps>`
  white-space: ${({ nowrap }) => (nowrap ? "nowrap" : "normal")};
  ${({ attention, primary, secondary, greenLight, disabled, theme, color }) =>
    (() => {
      switch (true) {
        case attention:
          return css`
            color: ${theme.colors?.attention};
          `;
        case greenLight:
          return css`
            color: ${theme.colors?.greenLight};
          `;
        case primary:
          return css`
            color: ${theme.colors?.textPrimary};
          `;
        case secondary:
          return css`
            color: ${theme.colors?.textSecondary};
          `;
        case disabled:
          return css`
            color: ${theme.colors?.textDisabled};
          `;
        default:
          return css`
            color: ${color ?? theme.colors?.textSecondary};
          `;
      }
    })()}
  ${({ type }) => (type ? TEXT_TYPES_MAP[type] : TEXT_TYPES_MAP.BODY)}
  ${({ uppercase }) => uppercase && "text-transform: uppercase;"}
  cursor: ${({ pointer }) => (pointer ? "pointer" : "inherit")}
`;
export default Text;
