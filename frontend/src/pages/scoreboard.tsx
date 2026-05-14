import { InfoCircleOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "antd";
import { useEffect, useState } from "react";
import { baseUrl } from "../api/constants";
import { useGetCurrent, useGetSchedule } from "../api/current";
import { ShowCurrent } from "../components/current/current";
import { useIsMobile } from "../hooks/useBreakpoint";
import { ScoreboardLayout } from "../layouts/scoreboard";
import { useTheme } from "../theme";

export const ScoreboardPage = () => {
  const queryClient = useQueryClient();
  const current = useGetCurrent();
  const schedule = useGetSchedule();
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [warningDismissed, setWarningDismissed] = useState(false);

  useEffect(() => {
    const previousMode = theme.mode;
    theme.setMode("dark");
    return () => {
      theme.setMode(previousMode);
    };
  }, [theme]);

  useEffect(() => {
    const es = new EventSource(`${baseUrl}/api/current/events`);
    es.addEventListener("update", () => {
      queryClient.invalidateQueries({ queryKey: ["current"] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    });
    return () => es.close();
  }, [queryClient]);

  return (
    <ScoreboardLayout>
      {isMobile && !warningDismissed && (
        <Alert
          icon={<InfoCircleOutlined />}
          showIcon
          banner
          closable
          onClose={() => setWarningDismissed(true)}
          message="Scoreboard is designed for large displays"
          description="This view is intended for TVs / projectors. Use the Judge interface for scoring on phones."
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        />
      )}
      <ShowCurrent current={current.data} schedule={schedule.data} />
    </ScoreboardLayout>
  );
};
