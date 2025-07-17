"use client";
import { BackgroundEffectsMenu } from "@/components/background-effects-menu";

export function BackgroundEffectsWidget() {
  return (
    <div className="p-0"> {/* Changed p-4 to p-0 */}
      <BackgroundEffectsMenu />
    </div>
  );
}