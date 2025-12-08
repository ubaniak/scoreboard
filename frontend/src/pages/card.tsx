import { Box, Tab, Tabs } from "@mui/material";
import { useParams } from "@tanstack/react-router";
import React from "react";
import { useGetById } from "../api/cards";
import { PageLayout } from "../layouts/page";
import { TabPanel } from "../components/tabPanel/tabPanel";
import { Devices } from "./card/devices";
import { Settings } from "./card/settings";
import { useProfile } from "../providers/login";

export const CardPage = () => {
  const profile = useProfile();
  const { cardId } = useParams({ from: "/card/$cardId" });
  const { data: card, isLoading } = useGetById(cardId, profile.token);

  // const { mutateAsync: updateSettings } = useMutateUpdateSettings(cardId);

  const [value, setValue] = React.useState(0);
  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (isLoading) {
    return <>loading</>;
  }

  return (
    <PageLayout
      title={`Card: ${card?.data.name}`}
      subheading={`Date: ${card?.data.date}`}
    >
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="Devices" />
          <Tab label="Settings" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <Devices card={card?.data} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Settings card={card?.data} />
      </TabPanel>
    </PageLayout>
  );
};
