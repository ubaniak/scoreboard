import { Col, Flex, Row } from "antd";
import type { Current } from "../../entities/current";
import { Card } from "../card/card";
import { StatusTag } from "../status/tag";

export type BoutInfoProps = {
  current?: Current;
};
export const BoutInfo = (props: BoutInfoProps) => {
  return (
    <Card>
      <Flex justify="center" gap="large" vertical align="center">
        <Row>
          <div>BOUT {props.current?.bout?.boutNumber}</div>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#ff4d4f",
              }}
            >
              {props.current?.bout?.redCorner.toUpperCase()}
            </div>
          </Col>
          <Col span={12}>
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#1677ff",
              }}
            >
              {props.current?.bout?.blueCorner.toUpperCase()}
            </div>
          </Col>
        </Row>
        <Row>
          {props.current?.bout?.weightClass} KG •{" "}
          {props.current?.bout?.experience}
        </Row>
        <Row>GLOVE {props.current?.bout?.gloveSize} oz</Row>
        <Row>ROUND LENGTH {props.current?.bout?.roundLength} Min(s)</Row>
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
