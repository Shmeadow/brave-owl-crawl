"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSignup: () => void;
}

export function EnrollmentModal({ isOpen, onClose, onLoginSignup }: EnrollmentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-[350px] p-6 text-center relative",
        "bg-gray-800/95 text-gray-100 rounded-lg shadow-lg border border-gray-700"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 text-gray-300 hover:text-orange-400"
          onClick={onClose}
          title="Close"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-orange-400">Unlock Advanced Settings!</DialogTitle>
          <DialogDescription className="text-sm text-gray-300 leading-relaxed">
            Sign up or log in to customize timer durations and save your preferences across devices.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Button
            className="bg-orange-500 text-gray-900 font-semibold py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
            onClick={onLoginSignup}
          >
            Sign Up / Log In
          </Button>
          <Button
            variant="outline"
            className="bg-transparent border border-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}