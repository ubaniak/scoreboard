import { App } from "antd";
import { useEffect } from "react";
import { getEmitter } from "../../events/events";
import { useProfile } from "../../providers/login";
import type { ApiError } from "../../api/fetchClient";
import { useNavigate } from "@tanstack/react-router";

export const ApiErrorHandler = () => {
  const profile = useProfile();
  const navigate = useNavigate();
  const { notification } = App.useApp();
  const emitter = getEmitter("apiErrors");

  useEffect(() => {
    emitter.on((error) => {
      const err = error as ApiError;
      if (err.status === 401) {
        profile.clear();
        navigate({ to: "/login" });
      }
      notification.error({
        title: "An api error occurred",
        description: error instanceof Error ? error.message : String(error),
      });
    });
  }, [notification, emitter, navigate, profile]);

  return null;
};
