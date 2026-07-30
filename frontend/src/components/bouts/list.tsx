import { EditOutlined, WarningOutlined } from "@ant-design/icons";
import { useNavigate } from "@tanstack/react-router";
import { Button, Input, Tag, Tooltip } from "antd";
import { useState } from "react";
import type { UpdateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";
import type { Bout, Official } from "../../entities/cards";
import { StatusTag } from "../status/tag";
import { EditBoutPanel } from "./EditBoutPanel";
import type { BoutRequestType } from "../../api/entities";
import { ActionMenu } from "../actionMenu/actionMenu";
import { RowList, type RowListColumn } from "../list/RowList";
import { getMismatches } from "./matchCompatibility";

export type ListBoutsProps = {
  token: string;
  cardId: string;
  bouts?: Bout[];
  loading?: boolean;
  officials?: Official[];
  athletes?: Athlete[];
  onEditBout: (values: {
    toUpdate: UpdateBoutProps;
    boutInfo: BoutRequestType;
  }) => Promise<unknown>;
  onDeleteBout?: (boutId: string) => void;
};
export const ListBouts = (props: ListBoutsProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = (props.bouts || []).filter((b) => {
    const q = search.toLowerCase();
    return (
      String(b.boutNumber).includes(q) ||
      b.redCorner?.toLowerCase().includes(q) ||
      b.blueCorner?.toLowerCase().includes(q) ||
      b.status?.toLowerCase().includes(q)
    );
  });

  const athleteById = new Map((props.athletes ?? []).map((a) => [a.id, a]));
  const mismatchesFor = (b: Bout) =>
    getMismatches(
      b.redAthleteId != null ? athleteById.get(b.redAthleteId) : undefined,
      b.blueAthleteId != null ? athleteById.get(b.blueAthleteId) : undefined,
    );

  const decisionLabels: Record<string, string> = {
    ud: "Unanimous Decision",
    sd: "Split Decision",
    md: "Majority Decision",
    rsc: "RSC",
    "rsc-i": "RSC (Injury)",
    abd: "Abandon",
    dq: "Disqualified",
    c: "Cancelled",
    wo: "Walk Over",
  };

  const columns: RowListColumn<Bout>[] = [
    {
      key: "warning",
      width: "28px",
      render: (b) => {
        const mismatches = mismatchesFor(b);
        if (mismatches.length === 0) return null;
        return (
          <Tooltip title={mismatches.map((m) => m.message).join(" • ")}>
            <WarningOutlined style={{ color: "#eab308", fontSize: 16 }} />
          </Tooltip>
        );
      },
    },
    {
      key: "boutNumber",
      title: "Bout Number",
      width: "90px",
      render: (b) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate({ to: `bout/${b.id}` })}>
          {b.boutNumber}
        </Button>
      ),
    },
    {
      key: "boutType",
      title: "Bout Type",
      width: "110px",
      render: (b) => <span style={{ textTransform: "capitalize" }}>{b.boutType || "scored"}</span>,
    },
    { key: "redCorner", title: "Red Corner", width: "1.2fr", render: (b) => b.redCorner },
    { key: "blueCorner", title: "Blue Corner", width: "1.2fr", render: (b) => b.blueCorner },
    { key: "ageCategory", title: "Age Category", width: "110px", render: (b) => b.ageCategory },
    { key: "experience", title: "Experience", width: "110px", render: (b) => b.experience },
    {
      key: "gender",
      title: "Gender",
      width: "90px",
      render: (b) => (b.gender ? <span style={{ textTransform: "capitalize" }}>{b.gender}</span> : null),
    },
    { key: "roundLength", title: "Round Length", width: "110px", render: (b) => b.roundLength },
    { key: "gloveSize", title: "Glove Size", width: "100px", render: (b) => b.gloveSize },
    { key: "status", title: "Status", width: "150px", render: (b) => <StatusTag text={b.status} /> },
    {
      key: "winner",
      title: "Winner",
      width: "90px",
      render: (b) => {
        if (!b.winner || b.winner === "na") return null;
        return <Tag color={b.winner}>{b.winner === "red" ? "Red" : "Blue"}</Tag>;
      },
    },
    {
      key: "decision",
      title: "Decision",
      width: "160px",
      render: (b) => (b.decision ? (decisionLabels[b.decision] ?? b.decision) : null),
    },
    {
      key: "action",
      width: "auto",
      render: (record) => (
        <ActionMenu
          trigger={{ shape: "circle", icon: <EditOutlined />, ariaLabel: "Edit bout" }}
          content={{
            title: "Edit Bout",
            body: (close) => (
              <EditBoutPanel
                token={props.token}
                cardId={props.cardId}
                bout={record}
                officials={props.officials}
                athletes={props.athletes}
                onClose={close}
                onSubmit={(toUpdate) =>
                  props.onEditBout({
                    toUpdate,
                    boutInfo: { boutId: record.id },
                  })
                }
                onDelete={
                  props.onDeleteBout
                    ? () => props.onDeleteBout!(record.id)
                    : undefined
                }
              />
            ),
          }}
          width={900}
        />
      ),
    },
  ];
  return (
    <>
      <Input.Search
        placeholder="Search bouts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />
      <RowList
        data={filtered}
        columns={columns}
        loading={props.loading}
        rowKey={(b) => b.id}
        emptyText="No bouts found."
        rowWarning={(b) => mismatchesFor(b).length > 0}
      />
    </>
  );
};
