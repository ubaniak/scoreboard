import { Typography } from "antd";
import type { Current } from "../../../entities/current";

type WaitingScreenProps = {
  role: string;
  judgeName: string;
  current?: Current;
  onChangeName: () => void;
  showWinnerPicker?: boolean;
  pickedWinner?: "red" | "blue" | null;
  onPickWinner?: (winner: "red" | "blue") => Promise<void>;
};

const statusMessages: Record<string, string> = {
  not_started: "Waiting for round to start",
  ready: "Waiting for round to start",
  in_progress: "Round in progress",
  score_complete: "Scores recorded",
  complete: "Round complete",
};

export const WaitingScreen = ({
  role,
  judgeName,
  current,
  onChangeName,
  showWinnerPicker,
  pickedWinner,
  onPickWinner,
}: WaitingScreenProps) => {
  const roundStatus = current?.round?.status ?? "not_started";
  const message = statusMessages[roundStatus] ?? "Waiting";
  const redCorner = current?.bout?.redCorner ?? "Red";
  const blueCorner = current?.bout?.blueCorner ?? "Blue";

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
        {message}
      </Typography.Title>
      {current?.bout && (
        <Typography.Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 15 }}>
          Bout {current.bout.boutNumber} · Round {current.round?.roundNumber ?? "—"}
        </Typography.Text>
      )}

      {showWinnerPicker && !pickedWinner && (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Typography.Text
            style={{
              display: "block",
              fontSize: 11,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              marginBottom: 16,
            }}
          >
            Pick Overall Winner
          </Typography.Text>
          <div style={{ display: "flex", gap: 16 }}>
            <button
              onClick={() => onPickWinner?.("red")}
              className="judge-winner-btn"
              style={{
                padding: "20px 36px",
                borderRadius: 14,
                border: "none",
                background: "#991b1b",
                color: "white",
                fontWeight: 800,
                fontSize: 20,
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              {redCorner}
            </button>
            <button
              onClick={() => onPickWinner?.("blue")}
              className="judge-winner-btn"
              style={{
                padding: "20px 36px",
                borderRadius: 14,
                border: "none",
                background: "#1d4ed8",
                color: "white",
                fontWeight: 800,
                fontSize: 20,
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              {blueCorner}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onChangeName}
        className="judge-text-btn"
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.25)",
          marginTop: 32,
          cursor: "pointer",
          letterSpacing: 2,
          textTransform: "uppercase",
          background: "none",
          border: "none",
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        Change name
      </button>
    </div>
  );
};
