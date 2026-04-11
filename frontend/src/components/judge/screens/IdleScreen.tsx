import { Typography } from "antd";

export const IdleScreen = ({ role }: { role: string }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#0b0f1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Typography.Text
      style={{
        fontSize: 18,
        letterSpacing: 6,
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.2)",
      }}
    >
      {role}
    </Typography.Text>
  </div>
);
