import type { Athlete } from "../../api/athletes";
import type { RosterEntry } from "../../api/roster";
import { TableLayout } from "../../layouts/table";
import { ActionMenu } from "../actionMenu/actionMenu";
import { AddToRoster } from "./add";
import { ListRoster } from "./list";

export type RosterIndexParams = {
  entries?: RosterEntry[];
  athletes?: Athlete[];
  loading?: boolean;
  onAdd: (athleteId: number) => Promise<unknown>;
  onSetAvailable: (athleteId: number, available: boolean) => Promise<unknown>;
  onRemove: (athleteId: number) => Promise<unknown>;
};

export const RosterIndex = (props: RosterIndexParams) => {
  const rosterAthleteIds = new Set((props.entries ?? []).map((e) => e.athleteId));
  const availableToAdd = (props.athletes ?? []).filter((a) => !rosterAthleteIds.has(a.id));

  return (
    <TableLayout
      title="Roster"
      actions={
        <ActionMenu
          trigger={{ text: "add athlete" }}
          content={{
            title: "Add to Roster",
            body: (close) => (
              <AddToRoster
                athletes={availableToAdd}
                onClose={close}
                onSubmit={(athleteId) => props.onAdd(athleteId)}
              />
            ),
          }}
        />
      }
    >
      <ListRoster
        entries={props.entries}
        loading={props.loading}
        onSetAvailable={props.onSetAvailable}
        onRemove={props.onRemove}
      />
    </TableLayout>
  );
};
