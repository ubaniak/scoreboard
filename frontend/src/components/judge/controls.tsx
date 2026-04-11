import { Button, Drawer } from "antd";
import { useState } from "react";
import type { Controls } from ".";
import type { Current } from "../../entities/current";

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

  const handleChangeScore = () => {
    setSelected(null);
  };

  const redCorner = props.current?.bout?.redCorner ?? "Red";
  const blueCorner = props.current?.bout?.blueCorner ?? "Blue";

  const redScore = selected ? (selected.winner === "red" ? 10 : selected.margin) : null;
  const blueScore = selected ? (selected.winner === "blue" ? 10 : selected.margin) : null;

  const redDimmed = !!selected && selected.winner !== "red";
  const blueDimmed = !!selected && selected.winner !== "blue";

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
        {/* Red half */}
        <div
          onClick={() => handleWinnerTap("red")}
          style={{
            flex: 1,
            background: "#991b1b",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: isLocked ? "default" : "pointer",
            opacity: redDimmed ? 0.45 : 1,
            transition: "opacity 0.3s ease",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Red Corner
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              padding: "0 24px",
              lineHeight: 1.2,
            }}
          >
            {redCorner}
          </div>
          {redScore !== null && (
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: "white",
                lineHeight: 1,
                marginTop: 32,
              }}
            >
              {redScore}
            </div>
          )}
        </div>

        {/* Blue half */}
        <div
          onClick={() => handleWinnerTap("blue")}
          style={{
            flex: 1,
            background: "#1d4ed8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: isLocked ? "default" : "pointer",
            opacity: blueDimmed ? 0.45 : 1,
            transition: "opacity 0.3s ease",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Blue Corner
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              padding: "0 24px",
              lineHeight: 1.2,
            }}
          >
            {blueCorner}
          </div>
          {blueScore !== null && (
            <div
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: "white",
                lineHeight: 1,
                marginTop: 32,
              }}
            >
              {blueScore}
            </div>
          )}
        </div>

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
                onClick={handleChangeScore}
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

      {/* Margin selection drawer */}
      <Drawer
        open={!!pendingWinner}
        placement="bottom"
        onClose={() => setPendingWinner(null)}
        title={
          pendingWinner
            ? `${pendingWinner === "red" ? redCorner : blueCorner} wins`
            : ""
        }
        styles={{
          wrapper: { height: "auto" },
          header: {
            textTransform: "uppercase",
            letterSpacing: 3,
            fontSize: 13,
          },
          body: { paddingBottom: 32 },
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {([9, 8, 7] as Margin[]).map((margin) => (
            <button
              key={margin}
              onClick={() => handleMarginSelect(margin)}
              style={{
                flex: 1,
                height: 88,
                background: pendingWinner === "red" ? "#991b1b" : "#1d4ed8",
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
    </>
  );
};
