import { useParams } from "@tanstack/react-router";
import { Flex, Typography } from "antd";
import { useGetCardById } from "../api/cards";
import { BoutIndex } from "../components/bouts";
import { DeviceIndex } from "../components/devices";
import { OfficialIndex } from "../components/officials";
import { Status } from "../components/status/status";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

const SubHeading = (props: { date?: string; status?: string }) => {
  return (
    <Flex gap="middle" orientation="vertical">
      <Typography.Title level={5}>Date: {props.date}</Typography.Title>
      <Status text={props.status || "unknown"} />
    </Flex>
  );
};

export const CardPage = () => {
  const profile = useProfile();
  const { cardId } = useParams({ from: "/card/$cardId" });
  const { data: card, isLoading } = useGetCardById(cardId, profile.token);

  if (isLoading) {
    return <>loading</>;
  }

  return (
    <PageLayout
      title={`Card: ${card?.data.name}`}
      subheading={
        <SubHeading date={card?.data.date} status={card?.data.status} />
      }
    >
      <Flex vertical={true}>
        <OfficialIndex cardId={card?.data.id || ""} />
        <BoutIndex cardId={card?.data.id || ""} />
        <DeviceIndex
          cardId={card?.data.id || ""}
          numberOfJudges={card?.data.numberOfJudges || 0}
        />
      </Flex>
    </PageLayout>
  );
};
