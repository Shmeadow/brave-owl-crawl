"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const LOCAL_STORAGE_UPGRADED_KEY = 'upgraded';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  "Unlimited Custom Themes & Dynamic Backgrounds",
  "All Premium Widgets (Focus Timer, AI Idea Generator, Habit Tracker, Goals Radar…)",
  "Deep Analytics & Interactive Insights Tab",
  "Priority 24/7 Support & Insider Community Lounge",
  "Shared Rooms & Real-Time Collaboration Tools",
  "Offline Mode with Seamless, Encrypted Sync",
  "Exclusive Templates, Masterclass Videos & Expert Guides",
  "Two-Factor Authentication, SSO Integrations & Advanced Security",
  "Early Access to New Features and Beta Releases",
];

const howItWorksSteps = [
  { title: "Activate Trial", description: "Tap Start Free Trial. Trial begins immediately, unlocking everything." },
  { title: "Enjoy Premium", description: "Experiment with all widgets, themes, and analytics for 7 days." },
  { title: "Decide or Cancel", description: "No commitment. Cancel any time before day 7; you won’t be charged." },
  { title: "Keep Your Perks", description: "If you love it (and you will), continue with a monthly or annual plan." },
];

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [hasUpgraded, setHasUpgraded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const upgradedStatus = localStorage.getItem(LOCAL_STORAGE_UPGRADED_KEY);
      setHasUpgraded(upgradedStatus === 'true');
    }
  }, [isOpen]);

  const handleUpgrade = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_UPGRADED_KEY, 'true');
      setHasUpgraded(true);
      toast.success("7-Day Trial Activated! Welcome to Premium.");
      onClose();
    }
  };

  if (hasUpgraded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md z-[1001] bg-card backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">You're a Premium Member!</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Thank you for your support. You have access to all features.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl z-[1001] bg-card backdrop-blur-xl border-white/20 p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-8">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-3xl font-bold">Upgrade to Premium</DialogTitle>
              <DialogDescription className="text-lg text-primary font-semibold">
                ―― Free 7-Day Trial ――
              </DialogDescription>
            </DialogHeader>

            <p className="text-center text-muted-foreground mb-6">
              Unlock every feature and supercharge your workflow. No credit card required; cancel anytime.
            </p>

            <Tabs defaultValue="monthly" className="w-full mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Monthly • $9.99/mo</TabsTrigger>
                <TabsTrigger value="annual">Annual • $99/yr (save 20%)</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <p className="text-center text-sm text-muted-foreground mb-8">
              • Your first 7 days are on us—full access, no obligations •
            </p>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-center mb-4">What You Get</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-foreground">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-center mb-4">How It Works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                {howItWorksSteps.map((step, index) => (
                  <div key={index}>
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold mb-2">Ready to Level Up?</h3>
              <Button size="lg" className="w-full max-w-xs mx-auto" onClick={handleUpgrade}>
                Start Free 7-Day Trial →
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By upgrading, you agree to our Terms of Service and Privacy Policy. After trial, your chosen plan auto-renews unless cancelled.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}