import type { CreateBoutProps, UpdateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";
import type { BoutRequestType } from "../../api/entities";
import type { Bout, Card, Official } from "../../entities/cards";
import { TableLayout } from "../../layouts/table";
import { ActionMenu } from "../actionMenu/actionMenu";
import { AddBout } from "./addBout";
import { ListBouts } from "./list";

export type BoutsIndexParams = {
  token: string;
  cardId: string;
  card?: Card;
  bouts?: Bout[];
  officials?: Official[];
  athletes?: Athlete[];
  loading?: boolean;
  onAddBout: (values: CreateBoutProps) => Promise<{ id: number }>;
  onAddBoutComment: (boutId: number, comment: string) => Promise<unknown>;
  onEditBout: (values: {
    toUpdate: UpdateBoutProps;
    boutInfo: BoutRequestType;
  }) => Promise<unknown>;
  onImport: (file: File) => Promise<unknown>;
  onDeleteBout?: (boutId: string) => void;
  auditLogs?: React.ReactNode;
};
export const BoutsIndex = (props: BoutsIndexParams) => {
  return (
    <TableLayout
      title="Bouts"
      actions={
        <ActionMenu
          trigger={{ text: "add" }}
          content={{
            title: "Add Bout",
            body: (close) => (
              <AddBout
                onClose={close}
                athletes={props.athletes}
                nextBoutNumber={Math.max(0, ...(props.bouts ?? []).map((b) => b.boutNumber)) + 1}
                bouts={props.bouts}
                onSubmit={(values: CreateBoutProps) => props.onAddBout(values)}
                onAddComment={(boutId, comment) => props.onAddBoutComment(boutId, comment)}
                onImport={props.onImport}
              />
            ),
          }}
          width={900}
        />
      }
    >
      <ListBouts
        token={props.token}
        cardId={props.cardId}
        bouts={props.bouts}
        loading={props.loading}
        officials={props.officials}
        athletes={props.athletes}
        onEditBout={(values) => props.onEditBout(values)}
        onDeleteBout={props.onDeleteBout}
      />
      {props.auditLogs && (
        <div style={{ marginTop: 24 }}>{props.auditLogs}</div>
      )}
    </TableLayout>
  );
};
