import { Tag } from "antd";
import type { ScoreRoundProps } from "../../api/score";
import type { Current } from "../../entities/current";
import { BoutInfo } from "./bout";
import { ScoreControls } from "./controls";

export type Controls = {
  scoreRound: (values: ScoreRoundProps) => void;
  complete: () => void;
};

export type JudgeIndexProps = {
  current?: Current;
  controls: Controls;
};
export const JudgeIndex = (props: JudgeIndexProps) => {
  return (
    <>
      <Tag style={{ width: "100%", textAlign: "center" }}>
        {/* {connected ? "CONNECTED" : "DISCONNECTED"} */}
      </Tag>

      <BoutInfo current={props.current} />

      <ScoreControls controls={props.controls} />
    </>
  );
};

// <Button
//   type="primary"
//   size="large"
//   block
//   // disabled={!judgeId || !selectedScore || submitted}
//   // onClick={handleSubmit}
// >
//   {/* {submitted ? "SCORE SUBMITTED" : "SUBMIT SCORE"} */}
// </Button>
