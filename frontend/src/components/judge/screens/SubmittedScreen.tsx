import { Typography } from "antd";

type SubmittedScreenProps = {
  role: string;
  judgeName: string;
};

export const SubmittedScreen = ({ role, judgeName }: SubmittedScreenProps) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0b0f1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <Typography.Text
        style={{
          fontSize: 11,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        {role} — {judgeName}
      </Typography.Text>
      <Typography.Title level={3} style={{ margin: 0, color: "white" }}>
        Scores Submitted
      </Typography.Title>
      <Typography.Text
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: 1,
        }}
      >
        Waiting for decision
      </Typography.Text>
    </div>
  );
};
