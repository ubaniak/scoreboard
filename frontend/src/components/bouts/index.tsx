import type { CreateBoutProps, UpdateBoutProps } from "../../api/bouts";
import type { BoutRequestType } from "../../api/entities";
import type { Bout } from "../../entities/cards";
import { TableLayout } from "../../layouts/table";
import { Modal } from "../modal/modal";
import { AddBout } from "./add";
import { ListBouts } from "./list";

export type BoutsIndexParams = {
  bouts?: Bout[];
  loading?: boolean;
  onAddBout: (values: CreateBoutProps) => void;
  onEditBout: (values: {
    toUpdate: UpdateBoutProps;
    boutInfo: BoutRequestType;
  }) => void;
};
export const BoutsIndex = (props: BoutsIndexParams) => {
  return (
    <TableLayout
      title="Bouts"
      actions={
        <Modal
          button={{ text: "add" }}
          modal={{
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
      }
    >
      <ListBouts
        bouts={props.bouts}
        loading={props.loading}
        onEditBout={(values) => props.onEditBout(values)}
      />
    </TableLayout>
  );
};
