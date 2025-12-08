import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert, type AlertColor } from "@mui/material";

type ToastOptions = {
  severity?: AlertColor;
  duration?: number;
};

type NotificationContextType = {
  toast: {
    info: (message: string) => void;
    success: (message: string) => void;
    warning: (message: string) => void;
    error: (message: string) => void;
  };
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

type Props = {
  children: React.ReactNode;
};

export const NotificationProvider: React.FC<Props> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("info");
  const [duration, setDuration] = useState<number>(3000);

  const toast = useCallback((msg: string, options: ToastOptions = {}) => {
    setMessage(msg);
    setSeverity(options.severity || "info");
    setDuration(options.duration || 3000);
    setOpen(true);
  }, []);

  const handleClose = () => setOpen(false);

  const contextValue: NotificationContextType = {
    toast: {
      info: (msg: string) => toast(msg, { severity: "info" }),
      success: (msg: string) => toast(msg, { severity: "success" }),
      warning: (msg: string) => toast(msg, { severity: "warning" }),
      error: (msg: string) => toast(msg, { severity: "error" }),
    },
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={severity} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
