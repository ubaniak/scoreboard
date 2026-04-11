import { Button, Card, Row, Space } from "antd";
import { Timer } from "../timer/timer";
import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useTimer } from "../../providers/timer";

export const TimerControls = () => {
  const timer = useTimer();
  return (
    <Card>
      <Row justify="center" style={{ margin: "12px 0 16px" }}>
        <Timer />
      </Row>
      <Row justify="center">
        <Space size={12}>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={timer.isRunning}
            onClick={() => {
              timer.controls.ringBell();
              timer.controls.play();
            }}
          >
            Start
          </Button>

          <Button
            icon={
              timer.isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />
            }
            onClick={
              timer.isRunning ? timer.controls.pause : timer.controls.play
            }
          >
            {timer.isRunning ? "Pause" : "Resume"}
          </Button>

          <Button onClick={timer.controls.reset}>Reset</Button>
        </Space>
      </Row>
    </Card>
  );
};
