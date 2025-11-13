"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRoleAccess } from "@/lib/auth-context";

interface GameHeaderProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: number;
  clock: string;
  status: "scheduled" | "active" | "paused" | "completed";
  onStartGame?: () => void;
  onPauseGame?: () => void;
  onResumeGame?: () => void;
  onEndPeriod?: () => void;
}

export function GameHeader({
  gameId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  period,
  clock,
  status,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onEndPeriod,
}: GameHeaderProps) {
  const { canManage } = useRoleAccess();

  const getStatusDisplay = () => {
    switch (status) {
      case "scheduled":
        return { text: "Not Started", color: "bg-blue-500" };
      case "active":
        return { text: "Live", color: "bg-green-500" };
      case "paused":
        return { text: "Paused", color: "bg-yellow-500" };
      case "completed":
        return { text: "Final", color: "bg-gray-500" };
      default:
        return { text: status, color: "bg-gray-500" };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Game Status and Controls */}
          <div className="flex justify-between items-center">
            <Badge className={`${statusDisplay.color} text-white`}>
              {statusDisplay.text}
            </Badge>

            {canManage && (
              <div className="flex gap-2">
                {status === "scheduled" && (
                  <Button onClick={onStartGame} size="sm">
                    Start Game
                  </Button>
                )}
                {status === "active" && (
                  <>
                    <Button onClick={onPauseGame} variant="outline" size="sm">
                      Pause
                    </Button>
                    <Button onClick={onEndPeriod} variant="outline" size="sm">
                      End Period
                    </Button>
                  </>
                )}
                {status === "paused" && (
                  <Button onClick={onResumeGame} size="sm">
                    Resume
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Score Display */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">
              {awayTeam} @ {homeTeam}
            </div>
            <div className="text-4xl font-mono font-bold">
              <span className={homeScore > awayScore ? "text-green-600" : ""}>
                {homeScore}
              </span>
              <span className="mx-4 text-muted-foreground">-</span>
              <span className={awayScore > homeScore ? "text-green-600" : ""}>
                {awayScore}
              </span>
            </div>
            <div className="text-lg text-muted-foreground mt-2">
              {status !== "scheduled" && (
                <>
                  Q{period} • {clock}
                </>
              )}
            </div>
          </div>

          {/* Team Names */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-900">{awayTeam}</div>
              <div className="text-sm text-blue-700">Away</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="font-semibold text-red-900">{homeTeam}</div>
              <div className="text-sm text-red-700">Home</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
