import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { useState } from "react";
import { useGetCards } from "../api/cards";
import { CardTable } from "../components/cards/cardTable";
import { CreateCardForm } from "../components/cards/createCard";
import { Modal } from "../components/modal/modal";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

export const HomePage = () => {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const { data: cards } = useGetCards(profile.token);

  const createCardButton = () => {
    return (
      <Button startIcon={<AddIcon />} onClick={() => setOpen(true)}>
        Create Card
      </Button>
    );
  };

  return (
    <PageLayout title="Cards" actions={createCardButton()}>
      <CardTable cards={cards?.data} />
      <Modal open={open} onClose={() => setOpen(false)} header="Create Card">
        <CreateCardForm
          onSubmit={() => {
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </PageLayout>
  );
};
