import { Modal as AntModal, Button } from "antd";
import type { ButtonShape } from "antd/es/button";
import { useState } from "react";

export type ModalProps = {
  button: {
    shape?: ButtonShape;
    icon?: React.ReactNode;
    text?: string;
  };
  modal: {
    title: string;
    body: (close: () => void) => React.ReactNode;
  };
};

export const Modal = (props: ModalProps) => {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  return (
    <>
      <Button
        shape={props.button.shape}
        onClick={() => setOpen(true)}
        icon={props.button.icon}
      >
        {props.button.text}
      </Button>
      <AntModal
        title={props.modal.title}
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {props.modal.body(close)}
      </AntModal>
    </>
  );
};
