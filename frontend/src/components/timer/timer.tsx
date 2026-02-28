import { Typography } from "antd";
import { useTimer } from "../../providers/timer";
const { Title } = Typography;

export const Timer = () => {
  const { seconds, minutes, secondsLeft } = useTimer();

  const isFinalCountdown = secondsLeft <= 10 && secondsLeft > 0;
  const flashOn = isFinalCountdown && secondsLeft % 2 === 0;

  // <div style={{ marginTop: 8, fontSize: 16 }}>⏱ {11}</div>
  return (
    <>
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
        {minutes}:{seconds}
      </Title>
    </>
  );
};
