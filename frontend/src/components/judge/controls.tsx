import { Button } from "antd";
import { useState } from "react";
import type { Controls } from ".";
import type { Current } from "../../entities/current";
import { CornerHalf } from "./CornerHalf";
import { MarginDrawer } from "./MarginDrawer";

type Margin = 9 | 8 | 7;
type Winner = "red" | "blue";

export type ScoreControlsProps = {
  controls: Controls;
  submitted: boolean;
  current?: Current;
  role: string;
  judgeName: string;
};

export const ScoreControls = (props: ScoreControlsProps) => {
  const [pendingWinner, setPendingWinner] = useState<Winner | null>(null);
  const [selected, setSelected] = useState<{ winner: Winner; margin: Margin } | null>(null);

  const isLocked = props.submitted;

  const handleWinnerTap = (winner: Winner) => {
    if (isLocked) return;
    setPendingWinner(winner);
  };

  const handleMarginSelect = (margin: Margin) => {
    if (!pendingWinner) return;
    const scores = {
      red: pendingWinner === "red" ? 10 : margin,
      blue: pendingWinner === "blue" ? 10 : margin,
    };
    setSelected({ winner: pendingWinner, margin });
    setPendingWinner(null);
    props.controls.scoreRound(scores);
  };

  const redCorner = props.current?.bout?.redCorner ?? "Red";
  const blueCorner = props.current?.bout?.blueCorner ?? "Blue";

  const redScore = selected ? (selected.winner === "red" ? 10 : selected.margin) : null;
  const blueScore = selected ? (selected.winner === "blue" ? 10 : selected.margin) : null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          zIndex: 100,
        }}
      >
        <CornerHalf
          corner="red"
          name={redCorner}
          score={redScore}
          dimmed={!!selected && selected.winner !== "red"}
          locked={isLocked}
          onTap={() => handleWinnerTap("red")}
        />
        <CornerHalf
          corner="blue"
          name={blueCorner}
          score={blueScore}
          dimmed={!!selected && selected.winner !== "blue"}
          locked={isLocked}
          onTap={() => handleWinnerTap("blue")}
        />

        {/* Role / name badge */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.45)",
            color: "rgba(255,255,255,0.75)",
            padding: "4px 20px",
            borderRadius: 20,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {props.role} — {props.judgeName}
        </div>

        {/* Round badge */}
        <div
          style={{
            position: "absolute",
            bottom: selected ? 120 : 40,
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.35)",
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            transition: "bottom 0.3s ease",
          }}
        >
          Round {props.current?.round?.roundNumber}
        </div>

        {/* Submit button */}
        {selected && (
          <div
            style={{
              position: "absolute",
              bottom: 40,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Button
              size="large"
              disabled={props.submitted}
              onClick={() => props.controls.complete()}
              style={{
                background: props.submitted ? "rgba(255,255,255,0.1)" : "white",
                color: props.submitted ? "rgba(255,255,255,0.4)" : "#111",
                border: "none",
                fontWeight: 700,
                letterSpacing: 2,
                padding: "0 56px",
                height: 56,
                fontSize: 14,
                borderRadius: 28,
              }}
            >
              {props.submitted ? "SUBMITTED" : "SUBMIT SCORE"}
            </Button>
            {!props.submitted && (
              <span
                onClick={() => setSelected(null)}
                style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                }}
              >
                Change score
              </span>
            )}
          </div>
        )}
      </div>

      <MarginDrawer
        open={!!pendingWinner}
        winner={pendingWinner}
        winnerName={pendingWinner === "red" ? redCorner : blueCorner}
        onClose={() => setPendingWinner(null)}
        onSelect={handleMarginSelect}
      />
    </>
  );
};
