"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

export interface NotificationProps {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onDismiss: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  error: <XCircle className="h-6 w-6 text-red-500" />,
  info: <Info className="h-6 w-6 text-blue-500" />,
  warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
};

export function MagicNotification({ id, title, message, type, duration = 5000, onDismiss }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="w-80 rounded-lg border bg-card p-4 shadow-lg"
    >
      <div className="flex items-start gap-4">
        {icons[type]}
        <div className="flex-1">
          <p className="font-semibold text-card-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDismiss(id)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}