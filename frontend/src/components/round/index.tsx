import {
  AlertOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  LockOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Tabs, type TabsProps } from "antd";
import { useEffect, useState } from "react";
import { useGetRounds } from "../../api/bouts";
import type { Round, RoundStatus } from "../../entities/cards";
import { useProfile } from "../../providers/login";
import { ShowRound } from "./show";

export type RoundIndexProps = {
  cardId: string;
  boutId: string;
};

const getStatusIcon = (status: RoundStatus) => {
  if (status === "ready") {
    return <AlertOutlined />;
  }
  if (status === "in_progress") {
    return <PlayCircleOutlined />;
  }

  if (status === "waiting_for_results") {
    return <LoadingOutlined />;
  }

  if (status === "complete") {
    return <CheckCircleOutlined />;
  }
  return <LockOutlined />;
};

const getRoundTab = (
  key: string,
  round: Round,
  cardId: string,
  boutId: string
): TabsProps => {
  return {
    key,
    label: `Round ${round.roundNumber}`,
    children: <ShowRound round={round} cardId={cardId} boutId={boutId} />,
    icon: getStatusIcon(round.status),
  } as TabsProps;
};

export const RoundIndex = (props: RoundIndexProps) => {
  const profile = useProfile();
  const [activeKey, setActiveKey] = useState<string | undefined>(undefined);
  const { data: rounds, isLoading } = useGetRounds(
    props.cardId,
    props.boutId,
    profile.token
  );

  useEffect(() => {
    const getActiveKey = () => {
      if (rounds?.data) {
        const readyIndex = rounds.data.findIndex(
          (round) => round.status === "ready" || round.status === "in_progress"
        );
        if (readyIndex !== -1) {
          setActiveKey(`${readyIndex}`);
        }
      }
    };
    getActiveKey();
  }, [rounds]);

  if (isLoading) {
    return <>Loading</>;
  }

  const roundItems = rounds?.data.map((round, index) =>
    getRoundTab(`${index}`, round, props.cardId, props.boutId)
  );

  return (
    <>
      <Tabs
        items={roundItems as TabsProps["items"]}
        tabPlacement="start"
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key)}
      />
    </>
  );
};
