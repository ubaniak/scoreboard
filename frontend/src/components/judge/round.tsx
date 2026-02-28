import { Flex, Row } from "antd";
import type { Current } from "../../entities/current";
import { Card } from "../card/card";
import { StatusTag } from "../status/tag";

export type RoundInfoProps = {
  current?: Current;
};

export const RoundInfo = (props: RoundInfoProps) => {
  return (
    <Card>
      <Flex justify="center" gap="large" vertical align="center">
        <Row>
          <div>Round {props.current?.round?.roundNumber}</div>
        </Row>
        <Row gutter={16}>
          <StatusTag text={props.current?.round?.status || ""} />
        </Row>
      </Flex>
    </Card>
  );
};
