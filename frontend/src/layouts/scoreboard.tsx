import { Layout } from "antd";
import { GlobalErrorHandler } from "../components/error/globalErrorHandler";

export type ScoreboardLayoutProps = {
  children: React.ReactNode;
};

export const ScoreboardLayout = (props: ScoreboardLayoutProps) => {
  return (
    <Layout style={{ minHeight: "100vh", background: "#0b0f1a" }}>
      <GlobalErrorHandler />
      <div
        style={{
          height: "100vh",
          background: "#0b0f1a",
          color: "white",
          padding: 32,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {props.children}
      </div>
    </Layout>
  );
};
