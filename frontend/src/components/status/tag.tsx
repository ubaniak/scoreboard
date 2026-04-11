import { Tag } from "antd";

export type TagColors =
  | "default"
  | "success"
  | "processing"
  | "warning"
  | "error"
  | "orange";

export const StatusTag = ({ text }: { text: string }) => {
  let color: TagColors = "default";
  let message = text;

  if (text === "upcoming") {
    message = "Upcoming";
  }

  if (text === "not_started") {
    message = "Not started";
    color = "default";
  }

  if (text === "ready") {
    message = "Ready";
    color = "orange";
  }

  if (text === "waiting_for_results") {
    message = "Waiting for results";
    color = "warning";
  }

  if (text === "in_progress") {
    color = "processing";
    message = "In progress";
  }

  if (text === "score_complete") {
    message = "Scores submitted";
    color = "success";
  }

  if (text === "waiting_for_scores") {
    message = "Waiting for scores";
    color = "warning";
  }

  if (text === "waiting_for_decision") {
    message = "Waiting for decision";
    color = "warning";
  }

  if (text === "decision_made") {
    message = "Decision made";
    color = "success";
  }

  if (text === "complete" || text === "completed") {
    message = "Complete";
    color = "success";
  }

  return (
    <Tag variant="outlined" color={color}>
      {message}
    </Tag>
  );
};
