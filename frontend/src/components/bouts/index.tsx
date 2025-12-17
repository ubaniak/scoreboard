import { Button, Collapse, Modal } from "antd";
import { useListBouts } from "../../api/bouts";
import { useProfile } from "../../providers/login";
import { ListBouts } from "./list";
import { AddBout } from "./add";
import { useState } from "react";

export type BoutIndexParams = {
  cardId: string;
};
export const BoutIndex = (props: BoutIndexParams) => {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useListBouts(props.cardId, profile.token);

  if (isLoading) {
    return <>Loading</>;
  }

  return (
    <>
      <Collapse
        size="large"
        items={[
          {
            key: 1,
            label: `Bouts (${data?.data.length})`,
            children: (
              <>
                <Button onClick={() => setOpen(true)}>Add</Button>
                <ListBouts cardId={props.cardId} bouts={data?.data || []} />
                <Modal
                  title="Add Bout"
                  open={open}
                  onOk={() => setOpen(false)}
                  onCancel={() => setOpen(false)}
                  footer={null}
                >
                  <AddBout
                    onClose={() => setOpen(false)}
                    carId={props.cardId}
                  />
                </Modal>
              </>
            ),
          },
        ]}
      />
    </>
  );
};
