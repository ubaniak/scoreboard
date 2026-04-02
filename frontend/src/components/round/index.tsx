import {
  CheckOutlined,
  LoadingOutlined,
  LockOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Button, Col, Row, Space, Steps } from "antd";
import { useState } from "react";
import type {
  EndBoutProps,
  MutateEightCountProps,
  MutateHandleFoulProps,
} from "../../api/bouts";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Card } from "../card/card";
import { StatusTag } from "../status/tag";
import { Timer } from "../timer/timer";
import { CornerControls } from "../bout/cornerControls";
import { ActionMenu } from "../actionMenu/actionMenu";
import { EndBout } from "../bouts/end";

export type RoundIndexProps = {
  round?: RoundDetails;
  rounds?: RoundDetails[];
  scores?: ScoresByRound;
  length: number;
  onChange: (roundNumber: number) => void;
  fouls: string[];
  handleFoul: (props: MutateHandleFoulProps) => void;
  handleEightCount: (props: MutateEightCountProps) => void;
  controls: {
    onNextRoundState: () => void;
    onEndBout: (props: EndBoutProps) => void;
  };
};

const getIcon = (status: RoundDetails["status"]) => {
  if (status === "waiting_for_results") {
    return <LoadingOutlined />;
  }
  if (status === "in_progress" || status === "score_complete") {
    return <PlayCircleOutlined />;
  }
  if (status === "complete") {
    return <CheckOutlined />;
  }

  return <LockOutlined />;
};

const calculateSteps = (rounds: RoundDetails[]) => {
  return rounds.map((round) => {
    return {
      title: `Round ${round.roundNumber}`,
      icon: getIcon(round.status),
    };
  });
};

export const RoundIndex = (props: RoundIndexProps) => {
  // const { secondsLeft, controls } = useTimer();
  const currentRound = props.round?.roundNumber || 1;
  const [selectedRound, setSelectedRound] = useState(currentRound - 1);

  const steps = calculateSteps(props.rounds || []);
  return (
    <Card
      title={
        <Steps
          items={steps}
          current={selectedRound}
          onChange={(value) => setSelectedRound(value - 1)}
        />
      }
    >
      <Row justify="center" style={{ margin: "12px 0 16px" }}>
        {props.rounds && (
          <Space>
            <Button
              onClick={() => {
                props.controls.onNextRoundState();
              }}
            >
              ({currentRound}){props.rounds[currentRound - 1].status}
            </Button>
            <ActionMenu
              width={1200}
              trigger={{
                override: (onOpen) => {
                  return (
                    <Button
                      danger
                      icon={<StopOutlined />}
                      onClick={() => {
                        onOpen();
                      }}
                    >
                      End
                    </Button>
                  );
                },
              }}
              content={{
                title: "End bout",
                body: (close) => (
                  <EndBout
                    onClose={() => close()}
                    onSubmit={(values) => {
                      props.controls.onEndBout(values);
                    }}
                    scores={props.scores}
                    rounds={props.rounds}
                  />
                ),
              }}
            />
          </Space>
        )}
      </Row>
      <Card>
        <Row justify="center" style={{ margin: "12px 0 16px" }}>
          <StatusTag text={props.round?.status || ""} />
        </Row>
        <Row justify="center" style={{ margin: "12px 0 16px" }}>
          <Timer />
        </Row>
        <Row justify="center">
          <Space size={12}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => {}}
            >
              Start
            </Button>

            <Button onClick={() => {}}>Reset</Button>

            <Button danger icon={<StopOutlined />} onClick={() => {}}>
              End
            </Button>
          </Space>
        </Row>
      </Card>
      {props.rounds && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <CornerControls
              corner="red"
              allFouls={props.fouls}
              handleFoul={props.handleFoul}
              handleEightCount={props.handleEightCount}
              warnings={props.rounds[currentRound - 1].red.warnings}
              cautions={props.rounds[currentRound - 1].red.cautions}
              eightCounts={props.rounds[currentRound - 1].red.eightCounts}
            />
          </Col>
          <Col xs={24} md={12}>
            <CornerControls
              corner="blue"
              allFouls={props.fouls}
              handleFoul={props.handleFoul}
              handleEightCount={props.handleEightCount}
              warnings={props.rounds[currentRound - 1].blue.warnings}
              cautions={props.rounds[currentRound - 1].blue.cautions}
              eightCounts={props.rounds[currentRound - 1].blue.eightCounts}
            />
          </Col>
        </Row>
      )}
    </Card>
  );
};
