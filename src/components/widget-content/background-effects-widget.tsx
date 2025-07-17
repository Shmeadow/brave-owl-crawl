"use client";
import { BackgroundEffectsMenu } from "@/components/background-effects-menu";

export function BackgroundEffectsWidget() {
  return (
    <div className="p-4"> {/* Changed p-0 back to p-4 */}
      <BackgroundEffectsMenu />
    </div>
  );
}