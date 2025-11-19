import React, { useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { Nullable } from "tsdef";

import { media } from "@themes/breakpoints";

import ArrowIcon from "@assets/icons/arrowUp.svg?react";

import { useMedia } from "@hooks/useMedia";
import { useOnClickOutside } from "@hooks/useOnClickOutside";

import { ROUTES } from "@constants";
import { isExternalLink } from "@utils/isExternalLink";

import { SmartFlex } from "../SmartFlex";
import Text, { TEXT_TYPES_MAP } from "../Text";

type MenuChildItem = {
  title: string;
  icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>> | null;
  link: string;
  desc?: string;
  onClick?: () => void;
};

type MenuItem = {
  title: string;
  accent?: boolean;
  link?: string;
  dataOnboardingKey?: string;
  children?: MenuChildItem[];
  icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>> | null;
};

const MENU_ITEMS: Array<MenuItem> = [
  {
    title: "TRADE",
    link: ROUTES.ROOT,
  },
  {
    title: "POOLS",
    link: ROUTES.POOL_LIST,
  },
];

const DROPDOWN_VARIANTS = {
  open: {
    height: "auto",
    transition: {
      duration: 0.1,
    },
  },
  closed: {
    height: 0,
    transition: {
      duration: 0.1,
    },
  },
};

interface Props {
  isMobile?: boolean;
  onMenuClick?: () => void;
}

export const MenuNav: React.FC<Props> = observer(({ isMobile, onMenuClick }) => {
  const media = useMedia();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<Nullable<string>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const Element = isMobile ? Row : Tab;

  const handleMenuItemClick = () => {
    onMenuClick?.();
  };

  const handleClickOutside = () => {
    if (media.mobile) return;

    setOpenDropdown(null);
  };

  useOnClickOutside(dropdownRef, handleClickOutside);

  const renderChildMenuItem = ({ title, link, icon: Icon, desc }: MenuChildItem) => {
    const isActive = location.pathname.includes(link);
    const externalProps = isExternalLink(link) ? { rel: "noopener noreferrer", target: "_blank" } : {};

    const handleChildClick = () => {
      handleMenuItemClick();
    };

    return (
      <NavLink key={title} to={link} onClick={handleChildClick} {...externalProps}>
        <DropdownMenu isActive={isActive}>
          <IconContainer>{Icon && <Icon height={24} width={24} />}</IconContainer>
          <DropdownMenuContent>
            <DropdownMenuTitle type="BUTTON_SECONDARY">{title}</DropdownMenuTitle>
            {desc && <Text type="BODY">{desc}</Text>}
          </DropdownMenuContent>
        </DropdownMenu>
      </NavLink>
    );
  };

  const renderMenuItem = ({ title, accent, link, dataOnboardingKey, children, icon: Icon }: MenuItem) => {
    const dataOnboardingDeviceKey = `${dataOnboardingKey}-${isMobile ? "mobile" : "desktop"}`;
    const isActive = Boolean(link && location.pathname.includes(link));

    const handleDropdownToggle = () => {
      setOpenDropdown(openDropdown === title ? null : title);
    };

    const handleItemClick = () => {
      handleMenuItemClick();
    };

    const titleComponent = title;

    if (children) {
      const isDropdownOpen = openDropdown === title;

      const isAnyChildrenActive = children.some((item) => location.pathname.includes(item.link));

      const isActive = isDropdownOpen || isAnyChildrenActive;

      return (
        <DropdownContainer key={title}>
          <Element
            data-onboarding={dataOnboardingDeviceKey}
            isAccent={accent}
            isActive={isActive}
            isDropdown
            onClick={handleDropdownToggle}
          >
            {titleComponent}
            <ArrowIconStyled open={isDropdownOpen} />
          </Element>
          <AnimatePresence mode="wait">
            {isDropdownOpen && (
              <Dropdown key="dropdown" animate="open" exit="closed" initial="closed" variants={DROPDOWN_VARIANTS}>
                {children.map((item) => renderChildMenuItem(item))}
              </Dropdown>
            )}
          </AnimatePresence>
        </DropdownContainer>
      );
    }

    if (!link) return;

    if (isExternalLink(link)) {
      return (
        <a
          key={title}
          data-onboarding={dataOnboardingDeviceKey}
          href={link}
          rel="noopener noreferrer"
          target="_blank"
          onClick={handleItemClick}
        >
          <Element isAccent={accent}>{titleComponent}</Element>
        </a>
      );
    }

    return (
      <NavLink key={title} data-onboarding={dataOnboardingDeviceKey} to={link} onClick={handleItemClick}>
        <Element isAccent={accent} isActive={isActive}>
          <IconContainer>{Icon && <Icon height={24} width={24} />}</IconContainer>
          {titleComponent}
        </Element>
      </NavLink>
    );
  };

  return MENU_ITEMS.map(renderMenuItem);
});

const ArrowIconStyled = styled(ArrowIcon)<{ open: boolean }>`
  width: 12px;
  height: 12px;
  transform: ${({ open }) => (open ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 250ms ease;

  ${media.mobile} {
    width: 16px;
    height: 16px;
  }
`;

const Tab = styled(SmartFlex)<{ isActive?: boolean; isDropdown?: boolean; isAccent?: boolean }>`
  ${TEXT_TYPES_MAP.BUTTON_SECONDARY}

  display: flex;
  align-items: center;
  gap: 4px;

  height: 32px;
  padding: 0 4px;

  font-weight: ${({ isActive }) => (isActive ? 700 : 500)};
  color: ${({ theme, isActive, isAccent }) => {
    if (isAccent) return theme.colors.greenStrong;
    return isActive ? theme.colors.textPrimary : theme.colors.textSecondary;
  }};

  ${ArrowIconStyled} {
    & > path {
      fill: ${({ isActive, theme }) => (isActive ? theme.colors.textPrimary : theme.colors.textSecondary)};
    }
  }

  border-bottom: 2px solid ${({ theme, isActive }) => (isActive ? theme.colors.textPrimary : "transparent")};

  transition: border-bottom 400ms ease;

  cursor: pointer;
`;

const Row = styled(SmartFlex)<{ isActive?: boolean; isDropdown?: boolean; isAccent?: boolean }>`
  ${TEXT_TYPES_MAP.TEXT_BIG}
  color: ${({ theme, isActive, isAccent }) => {
    if (isAccent) return theme.colors.greenStrong;
    return isActive ? theme.colors.textPrimary : theme.colors.textSecondary;
  }};

  display: flex;
  align-items: center;
  gap: 4px;

  padding: 12px 32px;
`;

const DropdownContainer = styled.div`
  position: relative;
`;

// @ts-ignore
const Dropdown = styled(motion(SmartFlex))`
  position: absolute;
  top: 120%;
  left: 0;

  z-index: 10;

  padding: 8px 0;

  width: 265px;

  overflow: hidden;

  display: flex;
  flex-direction: column;

  border-radius: 10px;

  background-color: ${({ theme }) => theme.colors.bgSecondary};

  box-shadow:
    0px 4px 20px 0px #00000080,
    1px 1px 2px 0px #00000040;

  ${media.mobile} {
    position: unset;
    box-shadow: unset;
    padding: unset;
    height: 128px;
    width: 100%;
    gap: 8px;

    padding-top: 8px;
  }
`;

const DropdownMenuTitle = styled(Text)`
  text-transform: uppercase;

  color: ${({ theme }) => theme.colors.textPrimary};
`;

const DropdownMenu = styled(SmartFlex)<{ isActive?: boolean }>`
  padding: 8px 16px;
  gap: 8px;
  align-items: center;
  cursor: pointer;

  & > svg {
    min-width: 24px;
    min-height: 24px;
  }

  ${({ isActive }) =>
    isActive &&
    css`
      background-color: #232323;

      ${DropdownMenuTitle} {
        width: fit-content;
      }
    `};

  &:hover {
    background-color: #232323;

    ${DropdownMenuTitle} {
      width: fit-content;
    }
  }

  ${media.mobile} {
    padding: 4px 48px;
  }
`;

const DropdownMenuContent = styled(SmartFlex)`
  flex-direction: column;

  ${media.mobile} {
    gap: 4px;
  }
`;

const IconContainer = styled(SmartFlex)`
  color: ${({ theme }) => theme.colors.iconSecondary};
`;
