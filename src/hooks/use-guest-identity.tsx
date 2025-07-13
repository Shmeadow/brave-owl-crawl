"use client";

import { useState, useEffect } from 'react';

const GUEST_ID_KEY = 'guest_unique_id';

function generateGuestId(): string {
  // A simpler, shorter ID for display purposes.
  return `guest-${Math.random().toString(36).substring(2, 10)}`;
}

export function useGuestIdentity() {
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedGuestId = localStorage.getItem(GUEST_ID_KEY);
      if (!storedGuestId) {
        storedGuestId = generateGuestId();
        localStorage.setItem(GUEST_ID_KEY, storedGuestId);
      }
      setGuestId(storedGuestId);
    }
  }, []);

  return { guestId };
}