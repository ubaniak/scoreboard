import { Button, Col, Flex, Row, Space, Typography } from "antd";
import type { MutateAddFoulProps } from "../../api/bouts";
import type { Bout, RoundDetails } from "../../entities/cards";
import { Card } from "../card/card";
import { StatusTag } from "../status/tag";
import { CornerControls } from "./cornerControls";
import { CornerPanel } from "./cornerPanel";
import { RoundControlBar } from "./roundControl";
import { Show } from "../show/show";

const { Text, Title } = Typography;

export type Controls = {
  nextRound: (currentRound: number) => void;
  previousRound: (currentRound: number) => void;
  addFoul: (props: MutateAddFoulProps) => void;
  startBout: () => void;
};

export type BoutIndexProps = {
  fouls?: string[];
  bout?: Bout;
  round?: RoundDetails;
  isLoading?: boolean;
  loadingComponent?: React.ReactNode | null;
  controls: Controls;
};
export const BoutIndex = (props: BoutIndexProps) => {
  if (props.isLoading && props.loadingComponent) {
    return <>{props.loadingComponent}</>;
  }

  const isReady = props.bout?.status !== "not_started" || false;
  return (
    <>
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space wrap size={16} align="baseline">
              <Space>
                <Text type="secondary">Bout number:</Text>
                <Text style={{ fontWeight: 700 }}>
                  {props.bout?.boutNumber}
                </Text>
              </Space>
              <Space>
                <Text type="secondary">Weight Class:</Text>
                <Text style={{ fontWeight: 700 }}>
                  {props.bout?.weightClass}
                </Text>
              </Space>
              <Space>
                <Text type="secondary">Glove Size:</Text>
                <Text style={{ fontWeight: 700 }}>{props.bout?.gloveSize}</Text>
              </Space>
              <Space>
                <Text type="secondary">Experience:</Text>
                <Text style={{ fontWeight: 700 }}>
                  {props.bout?.experience}
                </Text>
              </Space>
              <Space>
                <Text type="secondary">Round Length (min):</Text>
                <Text style={{ fontWeight: 700 }}>
                  {props.bout?.roundLength}
                </Text>
              </Space>
              <Space>
                <Text type="secondary">Age Category:</Text>
                <Text style={{ fontWeight: 700 }}>
                  {props.bout?.ageCategory}
                </Text>
              </Space>
            </Space>
          </Col>
          <Col>
            <StatusTag text={props.bout?.status || ""} />
          </Col>
        </Row>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <CornerPanel
            corner="red"
            isReady={isReady}
            athleteName={props.bout?.redCorner}
            warnings={props.round?.red.warnings}
            cautions={props.round?.red.cautions}
          />
        </Col>

        <Col xs={24} md={12}>
          <CornerPanel
            corner="blue"
            isReady={isReady}
            athleteName={props.bout?.blueCorner}
            warnings={props.round?.blue.warnings}
            cautions={props.round?.blue.cautions}
          />
        </Col>
      </Row>

      <Show show={!isReady}>
        <Card>
          <Flex align="center" justify="center">
            <Button
              onClick={() => {
                props.controls.startBout();
              }}
            >
              Start Bout
            </Button>
          </Flex>
        </Card>
      </Show>

      <Show show={isReady}>
        <RoundControlBar
          nextRound={props.controls.nextRound}
          previousRound={props.controls.previousRound}
          round={props?.round}
          roundLength={props.bout?.roundLength || 0}
        />
      </Show>

      <Show show={isReady}>
        <Card
          title={
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                Infractions & Counts
              </Title>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <CornerControls
                corner="red"
                fouls={props.fouls || []}
                addFoul={props.controls.addFoul}
              />
            </Col>
            <Col xs={24} md={12}>
              <CornerControls
                corner="blue"
                fouls={props.fouls || []}
                addFoul={props.controls.addFoul}
              />
            </Col>
          </Row>
        </Card>
      </Show>
    </>
  );
};
