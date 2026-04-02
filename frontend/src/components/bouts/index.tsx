import type { CreateBoutProps, UpdateBoutProps } from "../../api/bouts";
import type { BoutRequestType } from "../../api/entities";
import type { Bout } from "../../entities/cards";
import { TableLayout } from "../../layouts/table";
import { ActionMenu } from "../actionMenu/actionMenu";
import { AddBout } from "./add";
import { ImportBoutsCSV } from "./importCSV";
import { ListBouts } from "./list";

export type BoutsIndexParams = {
  bouts?: Bout[];
  loading?: boolean;
  onAddBout: (values: CreateBoutProps) => void;
  onEditBout: (values: {
    toUpdate: UpdateBoutProps;
    boutInfo: BoutRequestType;
  }) => void;
  onImport: (file: File) => Promise<unknown>;
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
            trigger={{ text: "add" }}
            content={{
              title: "Add Bout",
              body: (close) => (
                <>
                  <AddBout
                    onClose={close}
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
        onEditBout={(values) => props.onEditBout(values)}
        onDeleteBout={props.onDeleteBout}
      />
    </TableLayout>
  );
};
