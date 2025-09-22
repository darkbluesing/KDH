'use client';

import { useCallback, useState } from "react";

export function useModalState<T = unknown>() {
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState<T | null>(null);

  const open = useCallback((nextPayload: T) => {
    setPayload(nextPayload);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPayload(null);
  }, []);

  return { isOpen, payload, open, close } as const;
}
