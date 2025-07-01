"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Widget } from "@/components/widget/widget";
import { GoalInput } from "@/components/goal-input";
import { GoalList } from "@/components/goal-list";
import { NoteInput } from "@/components/note-input";
import { NoteList } from "@/components/note-list";
import { useGoals } from "@/hooks/use-goals";
import { useNotes } from "@/hooks/use-notes";
import { CalendarWidget } from "@/components/calendar-widget";
import { FlashcardWidget } from "@/components/flashcard-widget";
import { WelcomeWidget } from "@/components/welcome-widget";
import { SpotifyEmbedWidget } from "@/components/spotify-embed-widget";
import { AdWidget } from "@/components/ad-widget";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { goals, addGoal, toggleGoalComplete, deleteGoal } = useGoals();
  const { notes, addNote, toggleNoteStar, deleteNote } = useNotes();
  const { settings, loading: settingsLoading } = useAppSettings();
  const [isAdVisible, setIsAdVisible] = useState(true);

  useEffect(() => {
    if (!settingsLoading && settings) {
      const hasUpgraded = localStorage.getItem('upgraded') === 'true';
      setIsAdVisible(!hasUpgraded);
    }
  }, [settings, settingsLoading]);

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
        Welcome back!
      </h1>
      <div className="flex flex-wrap justify-start gap-4 w-full"> {/* Changed to flex-wrap and justify-start, removed h-full */}
        <Widget id="welcome" title="Welcome" initialMinimized={false}>
          <WelcomeWidget />
        </Widget>
        <Widget id="goals" title="Goals" initialMinimized={false}>
          <GoalInput onAddGoal={addGoal} />
          <GoalList
            goals={goals}
            onToggleComplete={toggleGoalComplete}
            onDelete={deleteGoal}
          />
        </Widget>
        <Widget id="notes" title="Notes" initialMinimized={false}>
          <NoteInput onAddNote={addNote} />
          <NoteList
            notes={notes}
            onToggleStar={toggleNoteStar}
            onDelete={deleteNote}
          />
        </Widget>
        <Widget id="calendar" title="Calendar" initialMinimized={false}>
          <CalendarWidget />
        </Widget>
        <Widget id="flashcards" title="Flashcards" initialMinimized={false}>
          <FlashcardWidget />
        </Widget>
        <Widget id="spotify" title="Spotify" initialMinimized={false}>
          <SpotifyEmbedWidget />
        </Widget>
        {isAdVisible && (
          <Widget id="ad" title="Ad" initialMinimized={false}>
            <AdWidget />
          </Widget>
        )}
      </div>
    </>
  );
}