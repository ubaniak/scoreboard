import { Dialog, DialogTitle, DialogContent } from "@mui/material";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  header: string;
  children: React.ReactNode;
}

export const Modal = (props: ModalProps) => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      sx={{
        bgcolor: "white",
        "& .MuiDialog-paper": {
          width: "700px",
          height: "600px",
          borderRadius: "12px",
          maxWidth: "none",
          maxHeight: "none",
        },
      }}
    >
      <DialogTitle>{props.header}</DialogTitle>
      <DialogContent sx={{}}>{props.children}</DialogContent>
    </Dialog>
  );
};
