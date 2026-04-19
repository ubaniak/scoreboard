import { Drawer } from "antd";

type Margin = 9 | 8 | 7;

type MarginDrawerProps = {
  open: boolean;
  winner: "red" | "blue" | null;
  winnerName: string;
  onClose: () => void;
  onSelect: (margin: Margin) => void;
};

export const MarginDrawer = ({ open, winner, winnerName, onClose, onSelect }: MarginDrawerProps) => (
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
          style={{
            flex: 1,
            height: 88,
            background: winner === "red" ? "#991b1b" : "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: 14,
            fontSize: 28,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          10-{margin}
        </button>
      ))}
    </div>
  </Drawer>
);
