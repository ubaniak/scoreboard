import { DeleteOutlined, EditOutlined, PictureOutlined } from "@ant-design/icons";
import { Link } from "@tanstack/react-router";
import { Button, Popconfirm, Space, Typography } from "antd";
import { useState } from "react";
import type { UpdateCardsProps } from "../../api/cards";
import type { CardRequestType } from "../../api/entities";
import type { Card, CardStatus } from "../../entities/cards";
import { radius, space, useTheme } from "../../theme";
import { ImageUpload } from "../image/imageUpload";
import { StatusTag } from "../status/tag";
import { ActionMenu } from "../actionMenu/actionMenu";
import { EditCard } from "./edit";

export type CardSecondaryListProps = {
  cards: Card[];
  onUpdateCard: (props: { id: CardRequestType; toUpdate: UpdateCardsProps }) => Promise<unknown>;
  onDeleteCard?: (cardId: string) => void;
  onUploadCardImage?: (cardId: string, file: File) => void;
  onRemoveCardImage?: (cardId: string) => void;
};

type Group = { status: CardStatus; label: string; defaultCollapsed: boolean };

const GROUPS: Group[] = [
  { status: "in_progress", label: "In progress", defaultCollapsed: false },
  { status: "upcoming", label: "Upcoming", defaultCollapsed: false },
  { status: "completed", label: "Completed", defaultCollapsed: true },
  { status: "cancelled", label: "Cancelled", defaultCollapsed: true },
];

const initialAvatarColor = (name: string) => {
  const hues = [217, 262, 12, 190, 32, 152];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${hues[Math.abs(hash) % hues.length]}, 55%, 45%)`;
};

export const CardSecondaryList = (props: CardSecondaryListProps) => {
  const { colors } = useTheme();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.status, g.defaultCollapsed])),
  );

  const groups = GROUPS.map((g) => ({
    ...g,
    cards: props.cards.filter((c) => c.status === g.status),
  })).filter((g) => g.cards.length > 0);

  if (groups.length === 0) {
    return (
      <Typography.Text type="secondary" style={{ display: "block", padding: `${space.lg}px 0`, textAlign: "center" }}>
        No cards match the current filters.
      </Typography.Text>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <div key={group.status} style={{ marginBottom: space.lg }}>
          <div
            onClick={() => setCollapsed((c) => ({ ...c, [group.status]: !c[group.status] }))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 4px",
              cursor: "pointer",
              color: colors.textMuted,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span style={{ transform: collapsed[group.status] ? "rotate(-90deg)" : undefined, transition: "transform 0.15s ease", opacity: 0.6 }}>
              ▾
            </span>
            {group.label} <span style={{ color: colors.textFaint, fontWeight: 400 }}>({group.cards.length})</span>
          </div>

          {!collapsed[group.status] && (
            <div
              style={{
                background: colors.bgElevated,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: radius.lg,
                boxShadow: colors.shadowSm,
                overflow: "hidden",
              }}
            >
              {group.cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1.6fr 100px 1fr 100px auto",
                    alignItems: "center",
                    gap: space.md,
                    padding: `12px ${space.md}px`,
                    borderBottom: `1px solid ${colors.borderSubtle}`,
                  }}
                >
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: radius.sm, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: radius.sm,
                        background: initialAvatarColor(card.name),
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {card.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <Link to="/card/$cardId" params={{ cardId: card.id }} style={{ fontWeight: 600, color: colors.text }}>
                      {card.name}
                    </Link>
                    <div style={{ fontSize: 12, color: colors.textFaint }}>{card.date}</div>
                  </div>

                  <StatusTag text={card.status} />

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: colors.borderSubtle, borderRadius: radius.pill, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: card.boutsTotal > 0 ? `${Math.round((card.boutsComplete / card.boutsTotal) * 100)}%` : "0%",
                          background: colors.blue,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: colors.textFaint, whiteSpace: "nowrap" }}>
                      {card.boutsComplete}/{card.boutsTotal}
                    </span>
                  </div>

                  <span style={{ fontSize: 12, color: colors.textFaint }}>{card.numberOfJudges} judges</span>

                  <Space>
                    {props.onUploadCardImage && (
                      <ActionMenu
                        trigger={{ shape: "circle", icon: <PictureOutlined />, ariaLabel: "Upload card image" }}
                        content={{
                          title: "Upload Image",
                          body: () => (
                            <ImageUpload
                              currentImageUrl={card.imageUrl}
                              onUpload={(file) => props.onUploadCardImage!(card.id, file)}
                              onRemove={props.onRemoveCardImage ? () => props.onRemoveCardImage!(card.id) : undefined}
                            />
                          ),
                        }}
                      />
                    )}
                    <ActionMenu
                      trigger={{ shape: "circle", icon: <EditOutlined />, ariaLabel: "Edit card" }}
                      content={{
                        title: "Edit Card",
                        body: (close) => (
                          <EditCard card={card} onClose={close} onSubmit={(vals) => props.onUpdateCard(vals)} />
                        ),
                      }}
                    />
                    {props.onDeleteCard && (
                      <Popconfirm
                        title="Delete this card?"
                        onConfirm={() => props.onDeleteCard!(card.id)}
                        okText="Delete"
                        cancelText="Cancel"
                      >
                        <Button danger shape="circle" icon={<DeleteOutlined />} aria-label="Delete card" />
                      </Popconfirm>
                    )}
                  </Space>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

