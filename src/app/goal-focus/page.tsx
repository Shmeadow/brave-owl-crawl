"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { GoalFocusDashboard } from "@/components/goal-focus-dashboard";

export default function GoalFocusPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col flex-1 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Goal Focus</h1>
        <GoalFocusDashboard />
      </div>
    </DashboardLayout>
  );
}