import { Breadcrumb, Layout, Space, Typography } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import { Content, Header } from "antd/es/layout/layout";
import { SettingsButton } from "../components/settings/SettingsButton";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import { useTheme } from "../theme";
const { Title, Text } = Typography;

export type PageLayoutProps = {
  title: string;
  subTitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  breadCrumbs?: ItemType[];
};

export const PageLayout = (props: PageLayoutProps) => {
  const { colors } = useTheme();
  return (
    <Layout style={{ minHeight: "100vh", background: colors.bg }}>
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        Skip to main content
      </a>
      <Header
        style={{
          background: colors.bgElevated,
          borderBottom: `1px solid ${colors.borderSubtle}`,
          padding: "0 16px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: "auto",
          minHeight: 64,
          lineHeight: "normal",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "12px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Space vertical size={0}>
            <Title level={2} style={{ margin: 0, fontSize: 18 }}>
              {props.title}
            </Title>
            <Space size={10} wrap>
              <Text type="secondary">{props.subTitle}</Text>
            </Space>
          </Space>

          <Space wrap>
            {props.action}
            <SettingsButton />
            <ThemeToggle />
          </Space>
        </div>
      </Header>
      <Content style={{ padding: 16 }}>
        <div id="main-content" style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Breadcrumb
            style={{ margin: "16px 0" }}
            items={props.breadCrumbs || []}
          />
          {props.children}
        </div>
      </Content>
    </Layout>
  );
};
