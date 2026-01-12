import { Breadcrumb, Layout, Space, Typography } from "antd";
import type { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import { Content, Header } from "antd/es/layout/layout";
const { Title, Text } = Typography;

export type PageLayoutProps = {
  title: string;
  subTitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  breadCrumbs?: ItemType[];
};

export const PageLayout = (props: PageLayoutProps) => {
  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Space direction="vertical" size={0}>
            <Title level={4} style={{ margin: 0 }}>
              {props.title}
            </Title>
            <Space size={10} wrap>
              <Text type="secondary">{props.subTitle}</Text>
            </Space>
          </Space>

          <Space wrap>{props.action}</Space>
        </div>
      </Header>
      <Content style={{ padding: 16 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
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
