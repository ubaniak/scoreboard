import { Skeleton, Typography } from "antd";
import { useMemo, useState } from "react";
import type { CreateCardProps, UpdateCardsProps } from "../../api/cards";
import type { CardRequestType } from "../../api/entities";
import { type Card } from "../../entities/cards";
import type { JudgeDevice } from "../../entities/device";
import { space } from "../../theme";
import { ActionMenu } from "../actionMenu/actionMenu";
import { AddCardShell } from "./AddCardShell";
import { CardSecondaryList } from "./CardSecondaryList";
import { defaultCardFilters, type CardFilters } from "./cardFilters";
import { CardToolbar } from "./CardToolbar";
import { LiveSpotlight } from "./LiveSpotlight";

export type CardTableProps = {
  cards?: Card[];
  isLoading: boolean;
  judges?: JudgeDevice[];
  onCreateCard: (props: CreateCardProps) => Promise<unknown>;
  onUpdateCard: (props: {
    id: CardRequestType;
    toUpdate: UpdateCardsProps;
  }) => Promise<unknown>;
  onDeleteCard?: (cardId: string) => void;
  onUploadCardImage?: (cardId: string, file: File) => void;
  onRemoveCardImage?: (cardId: string) => void;
  onImport?: (file: File) => Promise<unknown>;
};

const applyFilters = (cards: Card[], filters: CardFilters): Card[] => {
  let result = cards;

  if (filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter((c) => c.name.toLowerCase().includes(q));
  }
  if (filters.statuses.length > 0) {
    result = result.filter((c) => filters.statuses.includes(c.status));
  }
  if (filters.dateFrom && filters.dateTo) {
    result = result.filter((c) => c.date >= filters.dateFrom! && c.date <= filters.dateTo!);
  }
  if (filters.needsSetup) {
    result = result.filter((c) => c.boutsTotal === 0);
  }

  const sorted = [...result];
  sorted.sort((a, b) => {
    if (filters.sort === "name") return a.name.localeCompare(b.name);
    if (filters.sort === "status") return a.status.localeCompare(b.status);
    return a.date.localeCompare(b.date);
  });
  return sorted;
};

export const CardIndex = (props: CardTableProps) => {
  const [filters, setFilters] = useState<CardFilters>(defaultCardFilters);
  const cards = useMemo(() => props.cards ?? [], [props.cards]);

  const liveCard = useMemo(() => cards.find((c) => c.status === "in_progress"), [cards]);

  const filteredCards = useMemo(() => applyFilters(cards, filters), [cards, filters]);
  const secondaryCards = useMemo(
    () => filteredCards.filter((c) => c.id !== liveCard?.id),
    [filteredCards, liveCard],
  );

  if (props.isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (cards.length === 0) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center" }}>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          No event cards yet — create your first card to get started.
        </Typography.Text>
        <ActionMenu
          trigger={{ text: "Create Card" }}
          content={{
            title: "Create Card",
            body: (close) => (
              <AddCardShell onClose={close} onSubmit={(values) => props.onCreateCard(values)} onImport={props.onImport} />
            ),
          }}
          width={640}
        />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Cards
        </Typography.Title>
        <ActionMenu
          trigger={{ text: "Add" }}
          content={{
            title: "Create Card",
            body: (close) => (
              <AddCardShell onClose={close} onSubmit={(values) => props.onCreateCard(values)} onImport={props.onImport} />
            ),
          }}
          width={640}
        />
      </div>

      <CardToolbar filters={filters} onChange={setFilters} />

      <LiveSpotlight card={liveCard} judges={props.judges} />

      <CardSecondaryList
        cards={secondaryCards}
        onUpdateCard={props.onUpdateCard}
        onDeleteCard={props.onDeleteCard}
        onUploadCardImage={props.onUploadCardImage}
        onRemoveCardImage={props.onRemoveCardImage}
      />
    </div>
  );
};
