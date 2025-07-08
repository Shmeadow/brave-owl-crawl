"use client";

import React, { createContext, useState, useCallback } from 'react';
import { MagicNotification, NotificationProps } from '@/components/magic-notification';

export type NotificationOptions = Omit<NotificationProps, 'id' | 'onDismiss'>;

interface NotificationContextType {
  addNotification: (options: NotificationOptions) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = useCallback((options: NotificationOptions) => {
    const id = Date.now().toString();
    const onDismiss = (notificationId: string) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };
    setNotifications(prev => [...prev, { ...options, id, onDismiss }]);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[2000] flex flex-col gap-2">
        {notifications.map(props => (
          <MagicNotification key={props.id} {...props} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}