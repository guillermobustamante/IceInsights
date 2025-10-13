export type GoalStrength = "EVEN" | "PP" | "SH";

export type EventType = "goalFor" | "goalAgainst" | "penalty";

export type GoalAgainstSeverity = "Minor" | "Major" | "Misconduct";

export interface Player {
  id: string;
  number: number;
  name: string;
  position?: string;
  shoots?: "L" | "R";
}

export interface GameEvent {
  id: string;
  gameId: string;
  createdAt: string;
  period: number;
  clock: string;
  type: EventType;
  strength: GoalStrength;
  goalPlayerId?: string;
  assistIds: string[];
  plusPlayerIds: string[];
  minusPlayerIds: string[];
  penaltyInfraction?: string;
  penaltySeverity?: GoalAgainstSeverity;
  penaltyMinutes?: number;
  penaltyPlayerId?: string;
  notes?: string;
}

export interface PlayerAggregate {
  playerId: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  powerPlayGoals: number;
  shortHandedGoals: number;
  penaltyMinutes: number;
}

export interface GameSummary {
  id: string;
  opponent: string;
  date: string;
  status: "live" | "final" | "scheduled";
}
