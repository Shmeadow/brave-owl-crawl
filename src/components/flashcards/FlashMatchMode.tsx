"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Play, Users, Trophy, XCircle, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { useFlashMatch, FlashMatchPlayer } from "@/hooks/flashcards/useFlashMatch";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";

interface FlashMatchModeProps {
  isCurrentRoomWritable: boolean;
}

export function FlashMatchMode({ isCurrentRoomWritable }: FlashMatchModeProps) {
  const {
    currentMatch,
    players,
    currentRound,
    playerAnswers,
    loading,
    error,
    isLoggedIn,
    userId,
    joinMatch,
    startMatch,
    submitAnswer,
    stopMatch,
  } = useFlashMatch();
  const { currentRoomId, currentRoomName } = useCurrentRoom();
  const { profile } = useSupabase();

  const [answerInput, setAnswerInput] = useState("");
  const [totalRoundsInput, setTotalRoundsInput] = useState(5);

  const isCreator = currentMatch?.creator_id === userId;
  const isPlayerInMatch = players.some(p => p.user_id === userId);
  const isMatchActive = currentMatch?.status === 'in_progress';
  const isMatchLobby = currentMatch?.status === 'lobby';
  const isMatchCompleted = currentMatch?.status === 'completed' || currentMatch?.status === 'cancelled';

  const myPlayer = players.find(p => p.user_id === userId);
  const myAnswerForCurrentRound = playerAnswers.find(a => a.player_id === userId && a.round_id === currentRound?.id);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  const getPlayerDisplayName = (player: FlashMatchPlayer) => {
    return player.profiles?.first_name || player.profiles?.last_name || `User (${player.user_id.substring(0, 6)}...)`;
  };

  const getAnswerStatusIcon = (isCorrect: boolean) => {
    return isCorrect ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const handleStartMatch = () => {
    if (currentMatch?.id && currentRoomId) {
      startMatch(currentMatch.id, totalRoundsInput);
    }
  };

  const handleSubmitAnswer = () => {
    if (currentMatch?.id && currentRound?.round_number) {
      submitAnswer(currentMatch.id, currentRound.round_number, answerInput);
      setAnswerInput("");
    }
  };

  const handleStopMatch = () => {
    if (currentMatch?.id) {
      stopMatch(currentMatch.id);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-foreground mt-2">Loading FlashMatch...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <XCircle className="h-12 w-12 mb-4" />
        <p className="text-lg text-center">Error: {error}</p>
        <p className="text-sm text-muted-foreground mt-2">Please try again or contact support.</p>
      </div>
    );
  }

  if (!currentMatch || !currentRoomId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-lg text-muted-foreground">No active FlashMatch session found for this room.</p>
        <p className="text-sm text-muted-foreground mt-2">Please ensure you are in a room to start or join a game.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full p-2 sm:p-4">
      <h1 className="text-3xl font-bold text-foreground text-center">FlashMatch</h1>
      <p className="text-muted-foreground text-center">
        Multiplayer flashcard game in room: <span className="font-semibold text-primary">{currentRoomName}</span>
      </p>

      {!isLoggedIn && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardContent className="text-center text-sm text-muted-foreground p-2">
            You are currently browsing as a guest. Log in to play FlashMatch!
          </CardContent>
        </Card>
      )}

      {/* Match Status and Actions */}
      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" /> Match Status: <span className="capitalize">{currentMatch.status.replace('_', ' ')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMatchLobby && (
            <>
              <p className="text-muted-foreground">Waiting for players to join...</p>
              {!isPlayerInMatch && isLoggedIn && (
                <Button onClick={() => joinMatch(currentMatch.id)} className="w-full" disabled={!isCurrentRoomWritable}>
                  Join Match
                </Button>
              )}
              {isCreator && (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={totalRoundsInput}
                      onChange={(e) => setTotalRoundsInput(parseInt(e.target.value) || 1)}
                      className="w-24"
                      disabled={!isCurrentRoomWritable}
                    />
                    <span className="text-muted-foreground">Total Rounds</span>
                  </div>
                  <Button onClick={handleStartMatch} className="w-full" disabled={players.length < 1 || !isCurrentRoomWritable}>
                    Start Match
                  </Button>
                </>
              )}
            </>
          )}

          {isMatchActive && (
            <>
              <p className="text-muted-foreground">Round {currentMatch.current_round_number} of {currentMatch.total_rounds}</p>
              {isCreator && (
                <Button onClick={handleStopMatch} variant="destructive" className="w-full">
                  Stop Match
                </Button>
              )}
            </>
          )}

          {isMatchCompleted && (
            <>
              <p className="text-muted-foreground">Match has concluded.</p>
              {isCreator && (
                <Button onClick={() => { /* Logic to reset or start new match */ }} className="w-full">
                  Start New Match
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Players List */}
      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Players ({players.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <ul className="space-y-2">
              {sortedPlayers.map(player => (
                <li key={player.id} className="flex items-center justify-between text-sm">
                  <span className={cn("font-medium", player.user_id === userId && "text-primary")}>
                    {getPlayerDisplayName(player)} {player.user_id === userId && "(You)"}
                  </span>
                  <span className="font-bold">{player.score} pts</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Game Play Area */}
      {isMatchActive && currentRound && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              Round {currentRound.round_number}: Question
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold text-center">{currentRound.question}</p>
            
            {!myAnswerForCurrentRound ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Your answer..."
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                  disabled={!isCurrentRoomWritable || !isPlayerInMatch}
                />
                <Button onClick={handleSubmitAnswer} disabled={!isCurrentRoomWritable || !isPlayerInMatch}>Submit</Button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                You answered: <span className={cn("font-semibold", myAnswerForCurrentRound.is_correct ? "text-green-500" : "text-red-500")}>
                  {myAnswerForCurrentRound.answer_text}
                </span>
              </p>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-md">Answers this round:</h3>
              <ScrollArea className="h-32">
                <ul className="space-y-1">
                  {playerAnswers.map(answer => (
                    <li key={answer.id} className="flex items-center gap-2 text-sm">
                      {getAnswerStatusIcon(answer.is_correct)}
                      <span className="font-medium">{getPlayerDisplayName(answer as any)}:</span>
                      <span className="flex-1 truncate">{answer.answer_text}</span>
                      <span className="text-xs text-muted-foreground">({answer.score_awarded} pts, {answer.response_time}s)</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-Match Summary */}
      {isMatchCompleted && (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500 fill-current" /> Match Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Final Scores:</h3>
            <ul className="space-y-2">
              {sortedPlayers.map(player => (
                <li key={player.id} className="flex items-center justify-between text-base">
                  <span className={cn("font-bold", player.user_id === userId && "text-primary")}>
                    {getPlayerDisplayName(player)}
                  </span>
                  <span className="font-extrabold text-lg">{player.score} pts</span>
                </li>
              ))}
            </ul>
            {/* Add more summary details here later */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}