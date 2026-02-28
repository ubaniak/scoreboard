import { Tag } from "antd";
import type { Current } from "../../entities/current";
import { BoutInfo } from "./bout";
import { Controls } from "./controls";

export type JudgeIndexProps = {
  current?: Current;
};
export const JudgeIndex = (props: JudgeIndexProps) => {
  return (
    <>
      <Tag style={{ width: "100%", textAlign: "center" }}>
        {/* {connected ? "CONNECTED" : "DISCONNECTED"} */}
      </Tag>

      <BoutInfo current={props.current} />

      <Controls />
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
