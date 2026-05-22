"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const IDLE_MS = 25 * 60 * 1000;
const WARN_MS = 5 * 60 * 1000;

export function SessionTimeout() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [remaining, setRemaining] = useState(WARN_MS);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const deadlineRef = useRef(0);

  const resetIdle = useCallback(() => {
    setShowWarning(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    idleTimer.current = setTimeout(() => {
      deadlineRef.current = Date.now() + WARN_MS;
      setRemaining(WARN_MS);
      setShowWarning(true);
      countdownRef.current = setInterval(() => {
        const left = Math.max(0, deadlineRef.current - Date.now());
        setRemaining(left);
        if (left <= 0 && countdownRef.current) clearInterval(countdownRef.current);
      }, 1000);
    }, IDLE_MS);
  }, []);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handler = () => {
      if (!showWarning) resetIdle();
    };
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetIdle();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetIdle, showWarning]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning-text" />
            <DialogTitle className="text-sm font-semibold">Session Expiring</DialogTitle>
          </div>
          <DialogDescription className="text-xs mt-1">
            Your session will expire in {minutes}:{seconds.toString().padStart(2, "0")} due to inactivity.
            Any unsaved changes may be lost.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted border border-border">
          <div
            className="w-full bg-border rounded-full h-1.5"
            role="progressbar"
            aria-label="Time remaining before session expires"
            aria-valuemin={0}
            aria-valuemax={Math.round(WARN_MS / 1000)}
            aria-valuenow={Math.round(remaining / 1000)}
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ease-linear ${
                remaining > 120000 ? "bg-primary" : "bg-destructive"
              }`}
              style={{ width: `${(remaining / WARN_MS) * 100}%` }}
            />
          </div>
        </div>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowWarning(false);
              router.push("/");
              // In a real app this would call an auth logout endpoint
            }}
          >
            Sign Out
          </Button>
          <Button size="sm" onClick={resetIdle}>
            Extend Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
