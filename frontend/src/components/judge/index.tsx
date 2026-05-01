import { useEffect, useState } from "react";
import type { ScoreRoundProps } from "../../api/score";
import type { Official } from "../../entities/cards";
import type { Current } from "../../entities/current";
import type { ScoresByRound } from "../../entities/scores";
import { ScoreControls } from "./controls";
import { IdleScreen } from "./screens/IdleScreen";
import { NameScreen } from "./screens/NameScreen";
import { SubmittedScreen } from "./screens/SubmittedScreen";
import { WaitingScreen } from "./screens/WaitingScreen";

export type Controls = {
  scoreRound: (values: ScoreRoundProps) => void;
  complete: () => void;
  setReady: (name: string) => Promise<void>;
  pickOverallWinner: (winner: "red" | "blue") => Promise<void>;
};

export type JudgeIndexProps = {
  current?: Current;
  role: string;
  officials: Official[];
  controls: Controls;
  scores?: ScoresByRound;
};

export const JudgeIndex = (props: JudgeIndexProps) => {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [submittedRound, setSubmittedRound] = useState<number | null>(null);
  const [pickedWinner, setPickedWinner] = useState<"red" | "blue" | null>(null);

  const boutId = props.current?.bout?.id;
  const roundNumber = props.current?.round?.roundNumber;
  const boutStatus = props.current?.bout?.status;

  // Reset per-bout state when a new bout starts. React-recommended pattern
  // for resetting state on prop change (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  const [prevBoutId, setPrevBoutId] = useState<string | undefined>(boutId);
  if (boutId !== prevBoutId) {
    setPrevBoutId(boutId);
    setSelectedName(null);
    setSubmittedRound(null);
    setPickedWinner(null);
  }

  // The scores API omits judgeName/status/overallWinner for non-admin roles,
  // so server score lookup only works for admins. For judges, derive state
  // from the server score only when the current round's data is present.
  const myServerScore = props.scores?.[roundNumber ?? 0]?.find(
    (s) => s.judgeRole === props.role,
  );
  const resolvedName = selectedName ?? myServerScore?.judgeName ?? null;
  const resolvedSubmittedRound =
    submittedRound ??
    (myServerScore?.status === "complete" && roundNumber != null
      ? roundNumber
      : null);
  const submitted =
    resolvedSubmittedRound !== null && resolvedSubmittedRound === roundNumber;
  const resolvedPickedWinner = pickedWinner ?? myServerScore?.overallWinner ?? null;

  useEffect(() => {
    if (resolvedName && roundNumber && resolvedSubmittedRound !== roundNumber) {
      props.controls.setReady(resolvedName);
    }
  }, [roundNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!props.current?.card) {
    return <IdleScreen role={props.role} />;
  }

  const handleSelectName = async (name: string) => {
    setSelectedName(name);
    if (roundNumber) {
      await props.controls.setReady(name);
    }
  };

  const handleComplete = () => {
    props.controls.complete();
    setSubmittedRound(roundNumber ?? null);
  };

  const handlePickWinner = async (winner: "red" | "blue") => {
    await props.controls.pickOverallWinner(winner);
    setPickedWinner(winner);
  };

  if (!resolvedName) {
    return (
      <NameScreen
        role={props.role}
        officials={props.officials}
        onSelect={handleSelectName}
      />
    );
  }

  if (resolvedPickedWinner) {
    return <SubmittedScreen role={props.role} judgeName={resolvedName} />;
  }

  // Show winner picker when bout is in decision phase. Mirrors admin's
  // isDecisionPhase logic: score_complete on round 3 means all judges have
  // submitted and admin can act — judges should pick at the same time.
  // waiting_for_decision covers the case where admin explicitly advanced.
  const isRound3 = roundNumber === 3;
  const awaitingDecision =
    boutStatus === "waiting_for_decision" ||
    (boutStatus === "score_complete" && isRound3) ||
    (submitted && isRound3);

  if (awaitingDecision) {
    return (
      <WaitingScreen
        role={props.role}
        judgeName={resolvedName}
        current={props.current}
        onChangeName={() => setSelectedName(null)}
        showWinnerPicker
        pickedWinner={resolvedPickedWinner}
        onPickWinner={handlePickWinner}
      />
    );
  }

  if (props.current.round?.status !== "waiting_for_results") {
    return (
      <WaitingScreen
        role={props.role}
        judgeName={resolvedName}
        current={props.current}
        onChangeName={() => setSelectedName(null)}
      />
    );
  }

  return (
    <ScoreControls
      controls={{ ...props.controls, complete: handleComplete }}
      submitted={submitted}
      current={props.current}
      role={props.role}
      judgeName={resolvedName}
    />
  );
};
