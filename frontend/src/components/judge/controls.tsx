import { Button, Col, Flex, Row, Typography } from "antd";
import { useState } from "react";
import { Card } from "../card/card";
const { Title } = Typography;

export type ControlsProps = {
  score: (props: { red: number; blue: number; judgeNumber: number }) => void;
  complete: () => void;
};

export const Controls = (props: ControlsProps) => {
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);

  const setWin = (color: string) => {
    let win = color === "red" ? redScore : blueScore;
    let lose = color === "red" ? blueScore : redScore;

    if (win === 0 && lose === 0) {
      win = 10;
      lose = 9;
    } else {
      if (win === 10) {
        lose = lose - 1;
      } else {
        win = win + 1;
      }

      if (win === 10 && lose === 10) {
        win = 10;
        lose = 9;
      }
    }

    const setWin = color == "red" ? setRedScore : setBlueScore;
    const setLose = color == "red" ? setBlueScore : setRedScore;

    setWin(win);
    setLose(lose);
  };

  return (
    <Card>
      <Flex justify="center" gap="large" vertical align="center">
        <Button>Submit</Button>
      </Flex>
      <Row>
        <Col span={12}>
          <Flex justify="flex-start" gap="large" vertical align="center">
            <Title
              level={1}
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: 3,
                transition: "color 0.3s ease, transform 0.3s ease",
              }}
            >
              {redScore}
            </Title>
            <Button
              style={{
                background: "#ff4d4f",
              }}
              shape="circle"
              variant="filled"
              size="large"
              onClick={() => setWin("red")}
            />
          </Flex>
        </Col>
        <Col span={12}>
          <Flex justify="flex-start" gap="large" vertical align="center">
            <Title
              level={1}
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: 3,
                transition: "color 0.3s ease, transform 0.3s ease",
              }}
            >
              {blueScore}
            </Title>
            <Button
              style={{
                background: "#1677ff",
              }}
              shape="circle"
              variant="filled"
              size="large"
              onClick={() => setWin("blue")}
            />
          </Flex>
        </Col>
      </Row>
      <Flex justify="center" gap="large" vertical align="center">
        <Button onClick={() => props.complete()}>Submit</Button>
      </Flex>
    </Card>
  );
};
