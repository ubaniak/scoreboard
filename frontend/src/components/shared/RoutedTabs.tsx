import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Tabs } from "antd";

export type RoutedTabItem = {
  key: string;
  label: React.ReactNode;
  to: string;
};

export type RoutedTabsProps = {
  items: RoutedTabItem[];
  style?: React.CSSProperties;
};

export const RoutedTabs = ({ items, style }: RoutedTabsProps) => {
  const navigate = useNavigate();
  const { location } = useRouterState();

  const activeKey =
    items.find((item) => location.pathname === item.to)?.key ?? items[0]?.key;

  return (
    <Tabs
      style={style}
      activeKey={activeKey}
      onChange={(key) => {
        const item = items.find((i) => i.key === key);
        if (item) navigate({ to: item.to });
      }}
      items={items.map(({ key, label }) => ({ key, label }))}
    />
  );
};
