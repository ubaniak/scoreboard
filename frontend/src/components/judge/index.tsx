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

  // Derive judge name and submitted round from server scores when local state
  // hasn't been set (e.g. after a page refresh). Local state takes precedence
  // once the judge interacts.
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

  if (pickedWinner) {
    return <SubmittedScreen role={props.role} judgeName={resolvedName} />;
  }

  // Bout is awaiting an overall-winner decision. Round 3 transitions to
  // `complete` when admin advances, so `current.round` is nil here — don't
  // gate on roundNumber.
  const awaitingDecision = boutStatus === "waiting_for_decision";

  if (awaitingDecision) {
    return (
      <WaitingScreen
        role={props.role}
        judgeName={resolvedName}
        current={props.current}
        onChangeName={() => setSelectedName(null)}
        showWinnerPicker
        pickedWinner={pickedWinner}
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
