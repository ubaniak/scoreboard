import { Button, Collapse, Modal } from "antd";
import { useGetOfficials } from "../../api/cards";
import { useProfile } from "../../providers/login";
import { ListOfficials } from "./list";
import { useState } from "react";
import { AddOfficial } from "./add";

export type OfficialIndexProps = {
  cardId: string;
};

export const OfficialIndex = (props: OfficialIndexProps) => {
  const profile = useProfile();
  const { data: officials, isLoading } = useGetOfficials(
    props.cardId,
    profile.token
  );
  const [open, setOpen] = useState(false);

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
            label: `Officials (${officials?.data.length})`,
            children: (
              <>
                <Button onClick={() => setOpen(true)}>Add</Button>
                <ListOfficials
                  officials={officials?.data || []}
                  cardId={props.cardId}
                />
                <Modal
                  title="Add Official"
                  open={open}
                  onOk={() => setOpen(false)}
                  onCancel={() => setOpen(false)}
                  footer={null}
                >
                  <AddOfficial
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
