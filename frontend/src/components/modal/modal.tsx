import { Modal as AntModal, Button } from "antd";
import { useState } from "react";

export type ModalProps = {
  title: string;
  children: React.ReactNode;
  buttonText: string;
  actionOverride?: (setOpen: (state: boolean) => void) => React.ReactNode;
};

export const Modal = (props: ModalProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      {props.actionOverride ? (
        props.actionOverride(setOpen)
      ) : (
        <Button onClick={() => setOpen(true)}>{props.buttonText}</Button>
      )}
      <AntModal
        title={props.title}
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {props.children}
      </AntModal>
    </>
  );
};
