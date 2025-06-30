import { DashboardLayout } from "@/components/dashboard-layout";
import { MadeWithDyad } from "@/components/made-with-dyad";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 items-center sm:items-start">
        <h1 className="text-2xl font-bold">Welcome to your Productivity Hub!</h1>
        <p className="text-muted-foreground">
          Use the sidebar to navigate between your tools.
        </p>
      </div>
      <MadeWithDyad />
    </DashboardLayout>
  );
}