import { Drawer } from "antd";
import { useTheme } from "../../theme";

type Margin = 9 | 8 | 7;

type MarginDrawerProps = {
  open: boolean;
  winner: "red" | "blue" | null;
  winnerName: string;
  onClose: () => void;
  onSelect: (margin: Margin) => void;
};

export const MarginDrawer = ({ open, winner, winnerName, onClose, onSelect }: MarginDrawerProps) => {
  const { colors } = useTheme();

  return (
    <Drawer
      open={open}
      placement="bottom"
      onClose={onClose}
      title={winner ? `${winnerName} wins` : ""}
      styles={{
        wrapper: { height: "auto" },
        header: { textTransform: "uppercase", letterSpacing: 3, fontSize: 13 },
        body: { paddingBottom: 32 },
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        {([9, 8, 7] as Margin[]).map((margin) => (
          <button
            key={margin}
            onClick={() => onSelect(margin)}
            className="judge-margin-btn"
            style={{
              flex: 1,
              height: 88,
              background: winner === "red" ? colors.red : colors.blue,
              backgroundImage: colors.sheenOverlay,
              color: "white",
              border: "none",
              borderRadius: 14,
              fontSize: 28,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: 1,
              boxShadow: `${winner === "red" ? colors.glowRed : colors.glowBlue}, inset 0 1px 0 ${colors.insetHighlight}`,
            }}
          >
            10-{margin}
          </button>
        ))}
      </div>
    </Drawer>
  );
};
