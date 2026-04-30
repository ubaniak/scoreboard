import { Typography } from "antd";
import { useTheme } from "../../../theme";

export const IdleScreen = ({ role }: { role: string }) => {
  const { colors } = useTheme();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: colors.bg,
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
          color: colors.textFaint,
        }}
      >
        ( {role} ) A card has not been started yet
      </Typography.Text>
    </div>
  );
};
