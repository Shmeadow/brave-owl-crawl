"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Play, Users, BookOpen, Clock, Crown, MessageSquare, CheckCircle, XCircle, Trophy } from "lucide-react";
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
import { FlashMatchPlayer, FlashMatchPlayerAnswer } from "@/hooks/flash-attack/types"; // Import FlashMatchPlayer type
import { Category } from "@/hooks/flashcards/types"; // Import Category type

export function FlashAttackMode() {
  const {
    activeMatches,
    currentMatch,
    playersInCurrentMatch,
    currentRound,
    currentRoundAnswers,
    loading,
    roundCountdown,
    createMatch,
    joinMatch,
    startMatch,
    nextRound,
    submitAnswer,
    categories,
    userId,
  } = useFlashAttackGame();
  const { currentRoomId, currentRoomName, isCurrentRoomWritable } = useCurrentRoom();
  const { session } = useSupabase();

  const [newMatchRounds, setNewMatchRounds] = useState(5);
  const [newMatchDuration, setNewMatchDuration] = useState(30);
  const [newMatchCategory, setNewMatchCategory] = useState<string | null>(null);
  const [newMatchGameMode, setNewMatchGameMode] = useState<'free_for_all' | 'team_battle' | '1v1_duel'>('free_for_all');
  const [playerAnswer, setPlayerAnswer] = useState('');
  const answerStartTimeRef = useRef<number>(0);

  const isRoomOwner = currentMatch ? currentMatch.creator_id === userId : false;
  const isPlayerInCurrentMatch = playersInCurrentMatch.some((p: FlashMatchPlayer) => p.user_id === userId);
  const hasAnsweredCurrentRound = currentRoundAnswers.some(answer => answer.player_id === userId && answer.round_id === currentRound?.id);

  useEffect(() => {
    if (currentRound && currentMatch?.status === 'in_progress' && !hasAnsweredCurrentRound) {
      answerStartTimeRef.current = Date.now();
    }
  }, [currentRound, currentMatch?.status, hasAnsweredCurrentRound]);

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

  const handleNextRound = async () => {
    if (!currentMatch) return;
    if (!isRoomOwner) {
      toast.error("Only the match creator can advance rounds.");
      return;
    }
    await nextRound(currentMatch.id);
    setPlayerAnswer(''); // Clear answer input for next round
  };

  const handleSubmitAnswer = async () => {
    if (!currentMatch || !currentRound || !userId) return;
    if (!playerAnswer.trim()) {
      toast.error("Please type an answer.");
      return;
    }
    const responseTimeMs = Date.now() - answerStartTimeRef.current;
    await submitAnswer(currentMatch.id, currentRound.id, playerAnswer.trim(), responseTimeMs);
    setPlayerAnswer(''); // Clear answer input after submission
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

    const sortedPlayers = [...playersInCurrentMatch].sort((a, b) => b.score - a.score);
    const isCurrentRoundEnded = currentRound && roundCountdown === 0 && currentRound.round_end_time !== null;

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
                  sortedPlayers.map((player: FlashMatchPlayer) => (
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
                    <p className="text-sm text-muted-foreground">Time left: {roundCountdown}s</p>
                    
                    {isPlayerInCurrentMatch && !hasAnsweredCurrentRound && roundCountdown > 0 ? (
                      <>
                        <Input
                          placeholder="Type your answer..."
                          className="mt-4"
                          value={playerAnswer}
                          onChange={(e) => setPlayerAnswer(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSubmitAnswer();
                            }
                          }}
                          disabled={!isPlayerInCurrentMatch || hasAnsweredCurrentRound || roundCountdown === 0}
                        />
                        <Button className="mt-2 w-full" onClick={handleSubmitAnswer} disabled={!isPlayerInCurrentMatch || hasAnsweredCurrentRound || roundCountdown === 0 || !playerAnswer.trim()}>
                          Submit Answer
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-4">
                        {hasAnsweredCurrentRound ? "You have submitted your answer." : "Waiting for answers..."}
                      </p>
                    )}

                    {isCurrentRoundEnded && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-md font-semibold">Round Results:</h4>
                        <ul className="space-y-1">
                          {currentRoundAnswers.map(answer => (
                            <li key={answer.id} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1">
                                {answer.is_correct ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                {answer.profiles?.first_name || 'Unknown'}: {answer.answer_text}
                              </span>
                              <span className="font-semibold text-primary">+{answer.score_awarded} pts</span>
                            </li>
                          ))}
                        </ul>
                        {isRoomOwner && (
                          <Button onClick={handleNextRound} className="w-full mt-4" disabled={currentMatch.current_round_number >= currentMatch.total_rounds}>
                            Next Round
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                ) : (
                  <p className="text-muted-foreground text-center">Waiting for the next round to start...</p>
                )}
              </div>
            )}

            {isCompleted && (
              <div className="mt-4 text-center space-y-2">
                <h3 className="text-xl font-bold text-primary flex items-center justify-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500 fill-current" /> Game Over!
                </h3>
                <p className="text-lg">Final Scores:</p>
                <ul className="space-y-1">
                  {sortedPlayers.map((player: FlashMatchPlayer) => (
                    <li key={player.id} className="text-base font-semibold">
                      {player.profiles?.first_name || 'Unknown'}: {player.score} pts
                    </li>
                  ))}
                </ul>
                {/* <Button variant="outline" className="mt-4">View Full Summary</Button> */}
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