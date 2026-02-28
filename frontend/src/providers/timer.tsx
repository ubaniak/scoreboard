import { createContext, useContext, useEffect, useRef, useState } from "react";

type TimerContextValue = {
  seconds: string;
  minutes: string;
  secondsLeft: number;
  isRunning: boolean;
  controls: {
    reset: () => void;
    setup: (minutes: number) => void;
    play: () => void;
    pause: () => void;
    ringBell: () => void;
    clap: () => void;
  };
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const bellRef = useRef<HTMLAudioElement | null>(null);
  const clapRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bellRef.current = new Audio("/sounds/bell.mp3");
    clapRef.current = new Audio("/sounds/clap.mp3");

    bellRef.current.volume = 1.0;
    clapRef.current.volume = 1.0;
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const reset = () => {
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
  };

  const setup = (minutes: number) => {
    setInitialSeconds(minutes * 60);
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
  };

  const play = () => {
    setIsRunning(true);
  };
  const pause = () => {
    setIsRunning(false);
  };

  const ringBell = () => {
    bellRef.current?.play().catch(() => {});
  };

  const clap = () => {
    clapRef.current?.play().catch(() => {});
  };

  return (
    <TimerContext.Provider
      value={{
        minutes,
        seconds,
        secondsLeft,
        isRunning,
        controls: {
          setup,
          play,
          pause,
          reset,
          ringBell,
          clap,
        },
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error("useTimer must be used within TimerProvider");
  }
  return ctx;
}
