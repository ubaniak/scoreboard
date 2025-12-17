import { Outlet } from "@tanstack/react-router";
import { LoginProvider } from "../providers/login";
import { Layout, theme } from "antd";
import { Content } from "antd/es/layout/layout";

export const AppLayout = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  return (
    <Layout
      style={{
        padding: "24px 0",
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
      }}
    >
      <Content style={{ padding: "0 50px" }}>
        <LoginProvider>
          <Outlet />
        </LoginProvider>
      </Content>
    </Layout>
  );
};
