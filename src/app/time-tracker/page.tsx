import { DashboardLayout } from "@/components/dashboard-layout";
import { TimeTracker } from "@/components/time-tracker";

export default function TimeTrackerPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full py-8">
        <TimeTracker />
      </div>
    </DashboardLayout>
  );
}