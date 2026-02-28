import { Space } from "antd";
import type { Current } from "../../entities/current";
import { Show } from "../show/show";
import { CurrentBoutCard } from "./bout";
import { CurrentRoundCard } from "./round";

export type ShowCurrentProps = {
  current?: Current;
};
export const ShowCurrent = (props: ShowCurrentProps) => {
  return (
    <Space orientation="vertical" size={"large"}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 42, margin: 0 }}>{props.current?.card?.name}</h1>
      </div>
      <Show show={props.current?.bout !== undefined}>
        <CurrentBoutCard current={props.current} />
      </Show>
      <Show show={props.current?.round !== undefined}>
        <CurrentRoundCard current={props.current} />
      </Show>
    </Space>
  );
};
