import {
  LeftOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RightOutlined,
  StopOutlined,
} from "@ant-design/icons/lib/icons";
import { Button, Col, Modal, Row, Space, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import type { RoundDetails } from "../../entities/cards";
import { Card } from "../card/card";

const { Title, Text } = Typography;

export type RoundButtonControlBarProps = {
  roundLength: number;
  round?: RoundDetails;
  nextRound: (currentRound: number) => void;
  previousRound: (currentRound: number) => void;
};

const REST_DURATION = 60; // 1 minute
const MINUTES_IN_SECONDS = 60;

type Phase = "not_started" | "in_progress" | "paused" | "rest";

export const RoundControlBar = (props: RoundButtonControlBarProps) => {
  const bellRef = useRef<HTMLAudioElement | null>(null);
  const clapRef = useRef<HTMLAudioElement | null>(null);
  const tenSecondClapPlayedRef = useRef(false);

  const [secondsLeft, setSecondsLeft] = useState(
    props.roundLength * MINUTES_IN_SECONDS
  );
  const [phase, setPhase] = useState<Phase>("not_started");

  const isActive = phase === "in_progress" || phase === "rest";
  const isPaused = phase === "paused";

  const intervalRef = useRef<number | null>(null);
  const isFinalCountdown =
    (phase === "in_progress" || phase === "rest") &&
    secondsLeft <= 10 &&
    secondsLeft > 0;

  const flashOn = isFinalCountdown && secondsLeft % 2 === 0;

  const startRest = () => {
    setSecondsLeft(REST_DURATION);
    setPhase("rest");
  };

  useEffect(() => {
    bellRef.current = new Audio("/sounds/bell.mp3");
    clapRef.current = new Audio("/sounds/clap.mp3");

    bellRef.current.volume = 1.0;
    clapRef.current.volume = 1.0;
  }, []);

  // Interval logic
  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== null) clearInterval(intervalRef.current);

          if (phase === "in_progress") {
            // Round ended → bell + rest
            bellRef.current?.play().catch(() => {});
            startRest();
          } else if (phase === "rest") {
            // Rest ended → reset for next round
            setPhase("not_started");
            setSecondsLeft(props.roundLength * MINUTES_IN_SECONDS);
          }

          return 0;
        }

        // Play 10s clap during round
        if (
          phase === "in_progress" &&
          prev === 10 &&
          !tenSecondClapPlayedRef.current
        ) {
          for (let i = 0; i < 3; i++) {
            setTimeout(() => clapRef.current?.play().catch(() => {}), i * 400);
          }
          tenSecondClapPlayedRef.current = true;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [phase, props.roundLength, isActive]);

  const formatTime = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  const startRound = () => {
    setSecondsLeft(props.roundLength * MINUTES_IN_SECONDS);
    tenSecondClapPlayedRef.current = false;

    bellRef.current?.play().catch(() => {});
    setPhase("in_progress");
  };

  const resetRound = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    setSecondsLeft(props.roundLength * MINUTES_IN_SECONDS);
    setPhase("not_started");
  };

  const pauseRound = () => setPhase("paused");
  const resumeRound = () => setPhase("in_progress");

  const endRound = () => {
    Modal.confirm({
      title: "End round early?",
      okText: "End Round",
      okButtonProps: { danger: true },
      onOk: () => {
        setSecondsLeft(props.roundLength * MINUTES_IN_SECONDS);
      },
    });
  };

  return (
    <Card>
      <Row align="middle">
        <Col flex="auto">
          <Button
            type="text"
            onClick={() => {
              props.nextRound(props.round?.roundNumber || 0);
            }}
            icon={<LeftOutlined />}
            disabled={props.round?.roundNumber === 1}
          />
          <Text strong>Round {props.round?.roundNumber} / 3</Text>
          <Button
            type="text"
            icon={<RightOutlined />}
            disabled={props.round?.roundNumber === 3}
            onClick={() => {
              props.previousRound(props.round?.roundNumber || 0);
            }}
          />
        </Col>
        <Col>
          <Text type="secondary">{phase}</Text>
        </Col>
      </Row>

      <Row justify="center" style={{ margin: "12px 0 16px" }}>
        <Title
          level={1}
          style={{
            margin: 0,
            fontFamily: "monospace",
            fontWeight: flashOn ? 700 : 600,
            letterSpacing: 3,
            color: flashOn ? "#ff4d4f" : "inherit",
            transition: "color 0.3s ease, transform 0.3s ease",
            transform: flashOn ? "scale(1.05)" : "scale(1)",
          }}
        >
          {formatTime(secondsLeft)}
        </Title>
      </Row>

      <Row justify="center">
        <Space size={12}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={phase !== "not_started"}
            onClick={() => {
              startRound();
            }}
          >
            Start Round
          </Button>

          <Button
            icon={<PauseCircleOutlined />}
            onClick={() => {
              if (isPaused) resumeRound();
              else pauseRound();
            }}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>

          <Button disabled={phase !== "paused"} onClick={resetRound}>
            Reset
          </Button>

          <Button
            danger
            icon={<StopOutlined />}
            onClick={() => {
              endRound();
            }}
          >
            End Round
          </Button>
        </Space>
      </Row>
    </Card>
  );
};
