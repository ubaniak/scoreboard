import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "../api/constants";
import { useGetAnnouncerCurrent, announcerQueryKeys } from "../api/announcer";
import { useHealthCheck } from "../api/devices";
import { AnnouncerIndex } from "../components/announcer";
import { useProfile } from "../providers/login";
import { useTheme } from "../theme";

export const AnnouncerPage = () => {
  const { token } = useProfile();
  const queryClient = useQueryClient();
  const theme = useTheme();

  useEffect(() => {
    const previousMode = theme.mode;
    theme.setMode("dark");
    return () => {
      theme.setMode(previousMode);
    };
  }, [theme]);

  useHealthCheck({ token });
  const current = useGetAnnouncerCurrent({ token });

  useEffect(() => {
    const es = new EventSource(`${baseUrl}/api/current/events`);
    es.addEventListener("update", () => {
      queryClient.invalidateQueries({ queryKey: announcerQueryKeys.current(token) });
    });
    return () => es.close();
  }, [queryClient, token]);

  return <AnnouncerIndex current={current.data} />;
};
