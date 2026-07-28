import { Layout } from "antd";
import { GlobalErrorHandler } from "../components/error/globalErrorHandler";
import { useTheme } from "../theme";

export type ScoreboardLayoutProps = {
  children: React.ReactNode;
};

export const ScoreboardLayout = (props: ScoreboardLayoutProps) => {
  const { colors } = useTheme();
  return (
    <Layout style={{ minHeight: "100vh", background: colors.bg }}>
      <GlobalErrorHandler />
      <div
        style={{
          height: "100vh",
          background: colors.bg,
          color: colors.text,
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
