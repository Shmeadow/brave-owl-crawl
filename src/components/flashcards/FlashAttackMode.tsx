"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Play, Users, BookOpen, Clock, Crown, MessageSquare } from "lucide-react";
import { useFlashAttackGame } from "@/hooks/flash-attack/useFlashAttackGame";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlashMatchPlayer } from "@/hooks/flash-attack/types"; // Import FlashMatchPlayer type
import { Category } from "@/hooks/flashcards/types"; // Import Category type

export function FlashAttackMode() {
  const {
    activeMatches,
    currentMatch,
    playersInCurrentMatch,
    currentRound,
    loading,
    createMatch,
    joinMatch,
    startMatch,
    categories,
    userId,
  } = useFlashAttackGame();
  const { currentRoomId, currentRoomName, isCurrentRoomWritable } = useCurrentRoom();
  const { session } = useSupabase();

  const [newMatchRounds, setNewMatchRounds] = useState(5);
  const [newMatchDuration, setNewMatchDuration] = useState(30);
  const [newMatchCategory, setNewMatchCategory] = useState<string | null>(null);
  const [newMatchGameMode, setNewMatchGameMode] = useState<'free_for_all' | 'team_battle' | '1v1_duel'>('free_for_all');

  const isRoomOwner = currentMatch ? currentMatch.creator_id === userId : false;
  const isPlayerInCurrentMatch = playersInCurrentMatch.some((p: FlashMatchPlayer) => p.user_id === userId);

  const handleCreateMatch = async () => {
    if (!isCurrentRoomWritable) {
      toast.error("You must be the room owner to create a Flash Attack match.");
      return;
    }
    if (!newMatchCategory) {
      toast.error("Please select a flashcard category for the match.");
      return;
    }
    await createMatch(newMatchRounds, newMatchGameMode, newMatchDuration, newMatchCategory);
  };

  const handleJoinMatch = async (matchId: string) => {
    if (!session) {
      toast.error("You must be logged in to join a match.");
      return;
    }
    await joinMatch(matchId);
  };

  const handleStartMatch = async () => {
    if (!currentMatch) return;
    if (!isRoomOwner) {
      toast.error("Only the match creator can start the game.");
      return;
    }
    if (playersInCurrentMatch.length < 2) {
      toast.error("At least 2 players are required to start the game.");
      return;
    }
    await startMatch(currentMatch.id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-lg text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Flash Attack...
      </div>
    );
  }

  if (!currentRoomId) {
    return (
      <Card className="text-center p-8 w-full">
        <CardContent>
          <p className="text-lg">Flash Attack is available in rooms.</p>
          <p className="text-muted-foreground">Please select or create a room in the &apos;Spaces&apos; widget to play.</p>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="text-center p-8 w-full">
        <CardContent>
          <p className="text-lg">Flash Attack requires you to be logged in.</p>
          <p className="text-muted-foreground">Please log in to create or join a match.</p>
        </CardContent>
      </Card>
    );
  }

  // Display current match details if one is active
  if (currentMatch) {
    const isLobby = currentMatch.status === 'lobby';
    const isInProgress = currentMatch.status === 'in_progress';
    const isCompleted = currentMatch.status === 'completed';

    return (
      <div className="flex flex-col gap-6 w-full">
        <Card className="bg-card backdrop-blur-xl border-white/20 p-4">
          <CardHeader className="flex flex-row items-center justify-between p-0 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-500 fill-current" />
              Flash Attack Match
            </CardTitle>
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-semibold",
              isLobby && "bg-blue-500/20 text-blue-500",
              isInProgress && "bg-green-500/20 text-green-500",
              isCompleted && "bg-gray-500/20 text-gray-500"
            )}>
              {currentMatch.status.replace('_', ' ')}
            </span>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <p><span className="font-semibold">Room:</span> {currentRoomName}</p>
              <p><span className="font-semibold">Created by:</span> {currentMatch.profiles?.first_name || currentMatch.profiles?.last_name || 'Unknown'}</p>
              <p><span className="font-semibold">Deck:</span> {currentMatch.flashcard_categories?.name || 'All Cards'}</p>
              <p><span className="font-semibold">Rounds:</span> {currentMatch.current_round_number}/{currentMatch.total_rounds}</p>
              <p><span className="font-semibold">Mode:</span> {currentMatch.game_mode.replace(/_/g, ' ')}</p>
              <p><span className="font-semibold">Round Duration:</span> {currentMatch.round_duration_seconds}s</p>
            </div>

            <Separator />

            <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="h-5 w-5" /> Players ({playersInCurrentMatch.length})</h3>
            <ScrollArea className="h-32 w-full rounded-md border p-2">
              <div className="space-y-2">
                {playersInCurrentMatch.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center">No players yet.</p>
                ) : (
                  playersInCurrentMatch.map((player: FlashMatchPlayer) => (
                    <div key={player.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          player.user_id === userId && "text-primary",
                          player.user_id === currentMatch.creator_id && "text-yellow-500"
                        )}>
                          {player.profiles?.first_name || player.profiles?.last_name || `User (${player.user_id.substring(0, 8)}...)`}
                          {player.user_id === currentMatch.creator_id && " (Host)"}
                          {player.user_id === userId && " (You)"}
                        </span>
                      </div>
                      <span className="font-semibold">{player.score} pts</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {isLobby && (
              <div className="flex flex-col gap-2 mt-4">
                {!isPlayerInCurrentMatch && (
                  <Button onClick={() => handleJoinMatch(currentMatch.id)} className="w-full">
                    <Play className="mr-2 h-4 w-4" /> Join Match
                  </Button>
                )}
                {isRoomOwner && (
                  <Button onClick={handleStartMatch} className="w-full" disabled={playersInCurrentMatch.length < 2}>
                    <Play className="mr-2 h-4 w-4" /> Start Game
                  </Button>
                )}
                {!isRoomOwner && isPlayerInCurrentMatch && (
                  <p className="text-sm text-muted-foreground text-center">Waiting for the host to start the game...</p>
                )}
              </div>
            )}

            {isInProgress && (
              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Current Round: {currentMatch.current_round_number}</h3>
                {currentRound ? (
                  <Card className="bg-muted/50 border-border p-4 text-center">
                    <p className="text-xl font-bold mb-2">{currentRound.question}</p>
                    <p className="text-sm text-muted-foreground">Time left: {Math.max(0, Math.floor((new Date(currentRound.start_time).getTime() + currentMatch.round_duration_seconds * 1000 - new Date().getTime()) / 1000))}s</p>
                    {/* Placeholder for answer input and submission */}
                    <Input placeholder="Type your answer..." className="mt-4" disabled={!isPlayerInCurrentMatch} />
                    <Button className="mt-2 w-full" disabled={!isPlayerInCurrentMatch}>Submit Answer</Button>
                  </Card>
                ) : (
                  <p className="text-muted-foreground text-center">Waiting for the next round to start...</p>
                )}
              </div>
            )}

            {isCompleted && (
              <div className="mt-4 text-center space-y-2">
                <h3 className="text-xl font-bold text-primary">Game Over!</h3>
                <p className="text-lg">Final Scores:</p>
                <ul className="space-y-1">
                  {playersInCurrentMatch.map((player: FlashMatchPlayer) => (
                    <li key={player.id} className="text-base font-semibold">
                      {player.profiles?.first_name || 'Unknown'}: {player.score} pts
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-4">View Full Summary</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display create match form if no active match
  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-6 w-6" /> Create New Flash Attack Match
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCurrentRoomWritable && (
          <p className="text-sm text-destructive text-center">
            You must be the room owner to create a Flash Attack match.
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="deck-category">Flashcard Deck Category</Label>
          <Select
            value={newMatchCategory || ""}
            onValueChange={setNewMatchCategory}
            disabled={!isCurrentRoomWritable || categories.length === 0}
          >
            <SelectTrigger id="deck-category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.length === 0 && <SelectItem value="" disabled>No categories available</SelectItem>}
              {categories.map((cat: Category) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground">No flashcard categories found. Create some in 'Manage Deck' first.</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="total-rounds">Total Rounds</Label>
            <Input
              id="total-rounds"
              type="number"
              value={newMatchRounds}
              onChange={(e) => setNewMatchRounds(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              max={20}
              disabled={!isCurrentRoomWritable}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="round-duration">Round Duration (seconds)</Label>
            <Input
              id="round-duration"
              type="number"
              value={newMatchDuration}
              onChange={(e) => setNewMatchDuration(Math.max(5, parseInt(e.target.value) || 5))}
              min={5}
              max={60}
              disabled={!isCurrentRoomWritable}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="game-mode">Game Mode</Label>
          <Select
            value={newMatchGameMode}
            onValueChange={(value) => setNewMatchGameMode(value as 'free_for_all' | 'team_battle' | '1v1_duel')}
            disabled={!isCurrentRoomWritable}
          >
            <SelectTrigger id="game-mode">
              <SelectValue placeholder="Select game mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free_for_all">Free-for-All</SelectItem>
              <SelectItem value="1v1_duel">1v1 Duel (Requires 2 players)</SelectItem>
              <SelectItem value="team_battle">Team Battle (Requires 4+ players)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreateMatch} className="w-full" disabled={!isCurrentRoomWritable || !newMatchCategory}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Match
        </Button>
      </CardContent>
    </Card>
  );
}