import { Typography } from "antd";
import type { Current } from "../../../entities/current";

type WaitingScreenProps = {
  role: string;
  judgeName: string;
  current?: Current;
  onChangeName: () => void;
};

const statusMessages: Record<string, string> = {
  not_started: "Waiting for round to start",
  ready: "Waiting for round to start",
  in_progress: "Round in progress",
  score_complete: "Scores recorded",
  complete: "Round complete",
};

export const WaitingScreen = ({ role, judgeName, current, onChangeName }: WaitingScreenProps) => {
  const roundStatus = current?.round?.status ?? "not_started";
  const message = statusMessages[roundStatus] ?? "Waiting";

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
    <Typography.Text
      onClick={onChangeName}
      style={{
        fontSize: 11,
        color: "rgba(255,255,255,0.25)",
        marginTop: 32,
        cursor: "pointer",
        letterSpacing: 2,
        textTransform: "uppercase",
      }}
    >
      Change name
    </Typography.Text>
  </div>
  );
};
