import { Outlet } from "@tanstack/react-router";
import { Layout } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { LoginProvider } from "../providers/login";
import Title from "antd/es/typography/Title";
import { ApiErrorHandler } from "../components/error/apiErrorHandler";

export const AppLayout = () => {
  return (
    <Layout>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <Title style={{ margin: 0, color: "white" }}>Score card</Title>
      </Header>

      <Content style={{ padding: "20px 48px" }}>
        <LoginProvider>
          <ApiErrorHandler />
          <Outlet />
        </LoginProvider>
      </Content>
    </Layout>
  );
};
