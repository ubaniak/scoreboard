import {
  DesktopOutlined,
  HomeOutlined,
  SettingOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { Flex } from "antd";
import { Link, useRouterState } from "@tanstack/react-router";
import { useIsMobile } from "../../hooks/useBreakpoint";
import { useProfile } from "../../providers/login";
import { useTheme } from "../../theme";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  external?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: <HomeOutlined /> },
  { to: "/judge", label: "Judge", icon: <SoundOutlined /> },
  { to: "/scoreboard", label: "Scoreboard", icon: <DesktopOutlined />, external: true },
  { to: "/settings", label: "Settings", icon: <SettingOutlined />, adminOnly: true },
];

export const GlobalNav = () => {
  const { colors } = useTheme();
  const { role } = useProfile();
  const isMobile = useIsMobile();
  const { location } = useRouterState();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <div
      style={{
        background: colors.bgElevated,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        padding: "0 12px",
      }}
    >
      <Flex align="center" gap={isMobile ? 4 : 20} style={{ maxWidth: 1280, margin: "0 auto", height: 40 }}>
        {items.map((item) => {
          const isActive =
            !item.external &&
            (item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to));
          const label = (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                color: isActive ? colors.text : colors.textMuted,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.icon}
              {!isMobile && item.label}
            </span>
          );
          if (item.external) {
            return (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                style={{ padding: "8px 4px" }}
              >
                {label}
              </a>
            );
          }
          return (
            <Link key={item.to} to={item.to} aria-label={item.label} style={{ padding: "8px 4px" }}>
              {label}
            </Link>
          );
        })}
      </Flex>
    </div>
  );
};
