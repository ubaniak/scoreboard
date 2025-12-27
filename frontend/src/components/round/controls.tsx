import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Popover } from "antd";
import { useState } from "react";
import {
  useGetFouls,
  useMutateAddFoul,
  useMutateEightCount,
  useMutateEndRound,
  useMutateScoreRound,
  useMutateStartRound,
} from "../../api/bouts";
import type { RoundDetails } from "../../entities/cards";
import { useProfile } from "../../providers/login";
import { StatusTag } from "../status/tag";
import { SelectFoulHandler } from "./fouls";
import { RedBlueControl } from "./redBlueControl";

export type RoundControlsProps = {
  cardId: string;
  boutId: string;
  roundNumber: number;
  roundDetails: RoundDetails;
};

type HandleAddFoulProps = {
  corner: "red" | "blue";
  fouls: string[];
  onSelect: (foul: string) => void;
};
const HandleAddFoul = (props: HandleAddFoulProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      title={"Foul"}
      trigger={"click"}
      open={open}
      content={
        <SelectFoulHandler
          fouls={props.fouls}
          onClose={() => setOpen(false)}
          onSelect={(foul) => {
            props.onSelect(foul);
            setOpen(false);
          }}
        />
      }
    >
      <Button
        icon={<PlusOutlined />}
        variant="outlined"
        color={props.corner}
        onClick={() => setOpen(true)}
      />
    </Popover>
  );
};

type EightCountControlsProps = {
  corner: "red" | "blue";
  onClick: (props: { corner: string; direction: string }) => void;
};
const EightCountControls = (props: EightCountControlsProps) => {
  const handleOnClick = (direction: string) => {
    props.onClick({ corner: props.corner, direction });
  };

  return (
    <Flex vertical={true} align="center">
      <Button
        icon={<ArrowUpOutlined />}
        variant="outlined"
        color={props.corner}
        onClick={() => handleOnClick("up")}
      />
      <Button
        icon={<ArrowDownOutlined />}
        variant="outlined"
        color={props.corner}
        onClick={() => handleOnClick("down")}
      />
    </Flex>
  );
};

type RoundButtonControlsProps = {
  cardId: string;
  round: RoundDetails;
};

const RoundButtonControls = (props: RoundButtonControlsProps) => {
  const profile = useProfile();
  const { mutateAsync: startRound } = useMutateStartRound(
    props.cardId,
    props.round.boutId,
    props.round.roundNumber,
    profile.token
  );

  const { mutateAsync: scoreRound } = useMutateScoreRound(
    props.cardId,
    props.round.boutId,
    props.round.roundNumber,
    profile.token
  );

  const { mutateAsync: endRound } = useMutateEndRound(
    props.cardId,
    props.round.boutId,
    props.round.roundNumber,
    profile.token
  );

  return (
    <Flex gap={8}>
      <Button onClick={() => startRound()}>Start</Button>
      <Button onClick={() => scoreRound()}>Request scores</Button>
      <Button onClick={() => endRound({ decision: "complete" })}>End</Button>
    </Flex>
  );
};

export const RoundControls = (props: RoundControlsProps) => {
  const profile = useProfile();
  const { data: fouls } = useGetFouls(profile.token);
  const { mutateAsync: addFoul } = useMutateAddFoul(
    props.cardId,
    props.boutId,
    props.roundNumber,
    profile.token
  );

  const { mutateAsync: eightCount } = useMutateEightCount(
    props.cardId,
    props.boutId,
    props.roundNumber,
    profile.token
  );

  return (
    <Flex gap={8} vertical={true}>
      <Card>
        <StatusTag text={props.roundDetails.status} />
        <RoundButtonControls cardId={props.cardId} round={props.roundDetails} />
      </Card>
      {JSON.stringify(props.roundDetails)}
      <Flex gap={8}>
        <RedBlueControl
          title="Cautions"
          red={
            <HandleAddFoul
              corner="red"
              fouls={fouls?.data || []}
              onSelect={async (foul) => {
                addFoul({ corner: "red", type: "caution", foul });
              }}
            />
          }
          blue={
            <HandleAddFoul
              corner="blue"
              fouls={fouls?.data || []}
              onSelect={async (foul) => {
                addFoul({ corner: "blue", type: "caution", foul });
              }}
            />
          }
          redTotal={<>{props.roundDetails.red.cautions}</>}
          blueTotal={<>{props.roundDetails.blue.cautions}</>}
        />
        <RedBlueControl
          title="Warnings"
          red={
            <HandleAddFoul
              corner="red"
              fouls={fouls?.data || []}
              onSelect={async (foul) => {
                addFoul({ corner: "red", type: "warning", foul });
              }}
            />
          }
          blue={
            <HandleAddFoul
              corner="blue"
              fouls={fouls?.data || []}
              onSelect={async (foul) => {
                addFoul({ corner: "blue", type: "warning", foul });
              }}
            />
          }
          redTotal={<>{props.roundDetails.red.warnings}</>}
          blueTotal={<>{props.roundDetails.blue.warnings}</>}
        />
        <RedBlueControl
          title="Eight counts"
          red={
            <EightCountControls
              corner="red"
              onClick={async (props) => {
                eightCount(props);
              }}
            />
          }
          blue={
            <EightCountControls
              corner="blue"
              onClick={async (props) => {
                eightCount(props);
              }}
            />
          }
          redTotal={<>{props.roundDetails.red.eightCounts}</>}
          blueTotal={<>{props.roundDetails.blue.eightCounts}</>}
        />
      </Flex>
    </Flex>
  );
};
