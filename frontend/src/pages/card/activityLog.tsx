import { useParams } from "@tanstack/react-router";
import { useGetAuditLogs } from "../../api/auditLogs";
import { CardAuditTimeline } from "../../components/auditLogs/CardAuditTimeline";
import { useProfile } from "../../providers/login";

export const CardActivityLogPage = () => {
  const { token } = useProfile();
  const { cardId } = useParams({ strict: false });

  const auditLogs = useGetAuditLogs({ token, cardId });

  return <CardAuditTimeline logs={auditLogs.data ?? []} />;
};
