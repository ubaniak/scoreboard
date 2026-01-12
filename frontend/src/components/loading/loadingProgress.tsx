import { Col, Progress, Row, Typography } from "antd";
import { useEffect, useState } from "react";

const { Text } = Typography;

export type ProgressStep = {
  label: string;
  isLoading: boolean;
};

type StepProgressProps = {
  steps: ProgressStep[];
};

export const LoadingProgress = ({ steps }: StepProgressProps) => {
  const loadingStatus: boolean[] = Array.from(
    { length: steps.length },
    () => false
  );

  steps.forEach((val, index) => {
    loadingStatus[index] = val.isLoading;
  });

  const shouldRun = loadingStatus.some((val) => val);
  const [progress, setProgress] = useState(shouldRun ? 0 : 100);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress === 100) {
        setDirection(-1);
      }
      if (progress === 0) {
        setDirection(1);
      }
      setProgress(progress + direction);
    }, 3);

    return () => clearInterval(timer);
  }, [progress, direction]);

  return (
    <>
      {steps.map((step, index) => (
        <Row style={{ width: "100%" }} gutter={16}>
          <Col>
            <Text
              key={step.label}
              type={loadingStatus[index] ? "secondary" : "success"}
            >
              {index + 1}. {step.label}
            </Text>
          </Col>
          <Col>
            <Progress
              percent={loadingStatus[index] ? progress : 100}
              steps={40}
              showInfo={!loadingStatus[index]}
            />
          </Col>
        </Row>
      ))}
    </>
  );
};
