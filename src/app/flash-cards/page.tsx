import { DashboardLayout } from "@/components/dashboard-layout";
import { FlashCardDeck } from "@/components/flash-card-deck";

export default function FlashCardsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full py-8">
        <h1 className="text-3xl font-bold mb-8">Flash Cards</h1>
        <FlashCardDeck />
      </div>
    </DashboardLayout>
  );
}