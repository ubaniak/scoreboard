import { Button, Drawer } from "antd";
import type { ButtonShape } from "antd/es/button";
import { useEffect, useState } from "react";

export type ActionButtonProps = {
  shape?: ButtonShape;
  icon?: React.ReactNode;
  text?: string;
  override?: (onOpen: () => void) => React.ReactNode;
};

export type CloseAction = (promise?: Promise<unknown>) => void;

export type ActionMenuProps = {
  trigger: ActionButtonProps;
  menuOpen?: boolean;
  content: {
    title: string | React.ReactNode;
    body: (close: CloseAction) => React.ReactNode;
  };
  width?: number;
};

export const ActionMenu = (props: ActionMenuProps) => {
  const [open, setOpen] = useState(props.menuOpen ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (props.menuOpen) {
      setOpen(true);
    }
  }, [props.menuOpen]);

  const close: CloseAction = (promise?: Promise<unknown>) => {
    if (!promise) {
      setOpen(false);
      return;
    }
    setLoading(true);
    promise
      .then(() => setOpen(false))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const onOpen = () => {
    setOpen(true);
  };

  return (
    <>
      {props.trigger?.override ? (
        <>{props.trigger.override(onOpen)}</>
      ) : (
        <Button
          shape={props.trigger?.shape}
          onClick={() => setOpen(true)}
          icon={props.trigger.icon}
        >
          {props.trigger.text}
        </Button>
      )}
      <Drawer
        title={props.content.title}
        open={open}
        footer={null}
        width={props.width ?? 800}
        loading={loading}
        closable={!loading}
        maskClosable={!loading}
        onClose={loading ? undefined : () => close()}
      >
        {props.content.body(close)}
      </Drawer>
    </>
  );
};
