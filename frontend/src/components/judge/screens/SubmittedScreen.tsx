import { Typography } from "antd";
import { useTheme } from "../../../theme";

type SubmittedScreenProps = {
  role: string;
  judgeName: string;
};

export const SubmittedScreen = ({ role, judgeName }: SubmittedScreenProps) => {
  const { colors } = useTheme();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: colors.bg,
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
          color: colors.textMuted,
        }}
      >
        {role} — {judgeName}
      </Typography.Text>
      <Typography.Title level={3} style={{ margin: 0, color: colors.text }}>
        Scores Submitted
      </Typography.Title>
      <Typography.Text
        style={{
          fontSize: 13,
          color: colors.textFaint,
          letterSpacing: 1,
        }}
      >
        Waiting for decision
      </Typography.Text>
    </div>
  );
};
