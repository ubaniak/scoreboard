import { Button, Modal } from "antd";
import { useListCards } from "../api/cards";
import { CardTable } from "../components/cards/cardTable";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";
import { useState } from "react";
import { CreateCard } from "../components/cards/createCard";

export const HomePage = () => {
  const profile = useProfile();
  const { data: cards } = useListCards(profile.token);
  const [open, setOpen] = useState(false);

  return (
    <PageLayout title="Cards" subheading="hello">
      <Button onClick={() => setOpen(true)}>Add Card</Button>
      <CardTable cards={cards?.data} />
      <Modal
        title={"Add card"}
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <CreateCard onClose={() => setOpen(false)} />
      </Modal>
    </PageLayout>
  );
};
