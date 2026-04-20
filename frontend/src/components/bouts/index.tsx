import type { CreateBoutProps, UpdateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";
import type { BoutRequestType } from "../../api/entities";
import type { Bout, Card, Official } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { TableLayout } from "../../layouts/table";
import { ActionMenu } from "../actionMenu/actionMenu";
import { AddBout } from "./add";
import { ExportCard } from "./exportCard";
import { ImportBoutsCSV } from "./importCSV";
import { MasterImportCSV } from "./masterImportCSV";
import { ListBouts } from "./list";

export type BoutsIndexParams = {
  card?: Card;
  bouts?: Bout[];
  officials?: Official[];
  athletes?: Athlete[];
  allBoutScores?: Record<string, ScoresByRound>;
  loading?: boolean;
  onAddBout: (values: CreateBoutProps) => void;
  onEditBout: (values: {
    toUpdate: UpdateBoutProps;
    boutInfo: BoutRequestType;
  }) => void;
  onImport: (file: File) => Promise<unknown>;
  onMasterImport: (file: File) => Promise<unknown>;
  onDeleteBout?: (boutId: string) => void;
};
export const BoutsIndex = (props: BoutsIndexParams) => {
  return (
    <TableLayout
      title="Bouts"
      actions={
        <>
          <ActionMenu
            trigger={{ text: "import" }}
            content={{
              title: "Import Bouts",
              body: (close) => (
                <>
                  <ImportBoutsCSV onClose={close} onImport={props.onImport} />
                </>
              ),
            }}
          />
          <ActionMenu
            trigger={{ text: "master import" }}
            content={{
              title: "Master Import (CSV)",
              body: (close) => (
                <MasterImportCSV onClose={close} onImport={props.onMasterImport} />
              ),
            }}
          />
          {props.card && (
            <ActionMenu
              trigger={{ text: "export" }}
              content={{
                title: "Export Bouts",
                body: () => (
                  <ExportCard
                    card={props.card!}
                    bouts={props.bouts ?? []}
                    allBoutScores={props.allBoutScores ?? {}}
                  />
                ),
              }}
            />
          )}
          <ActionMenu
            trigger={{ text: "add" }}
            content={{
              title: "Add Bout",
              body: (close) => (
                <>
                  <AddBout
                    onClose={close}
                    athletes={props.athletes}
                    onSubmit={(values: CreateBoutProps) => {
                      props.onAddBout(values);
                    }}
                  />
                </>
              ),
            }}
          />
        </>
      }
    >
      <ListBouts
        bouts={props.bouts}
        loading={props.loading}
        officials={props.officials}
        athletes={props.athletes}
        onEditBout={(values) => props.onEditBout(values)}
        onDeleteBout={props.onDeleteBout}
      />
    </TableLayout>
  );
};
