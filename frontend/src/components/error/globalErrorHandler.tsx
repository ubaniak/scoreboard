import { App } from "antd";
import { useEffect } from "react";
import { getEmitter } from "../../events/events";

export const GlobalErrorHandler = () => {
  const { notification } = App.useApp();
  const emitter = getEmitter("errors");

  useEffect(() => {
    emitter.on((error) => {
      notification.error({
        title: "An error occurred",
        description: error instanceof Error ? error.message : String(error),
      });
    });
  }, [notification, emitter]);

  return null;
};
