import type { GameEvent, Player, PlayerAggregate } from "../types";

export const sortEventsByCreatedDesc = (events: GameEvent[]): GameEvent[] => {
  return [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const ensureAggregate = (
  map: Map<string, PlayerAggregate>,
  playerId: string
): PlayerAggregate => {
  if (!map.has(playerId)) {
    map.set(playerId, {
      playerId,
      goals: 0,
      assists: 0,
      points: 0,
      plusMinus: 0,
      powerPlayGoals: 0,
      shortHandedGoals: 0,
      penaltyMinutes: 0,
    });
  }
  return map.get(playerId)!;
};

export const computeAggregates = (
  players: Player[],
  events: GameEvent[]
): PlayerAggregate[] => {
  const playerIds = new Set(players.map((player) => player.id));
  const results = new Map<string, PlayerAggregate>();

  events.forEach((event) => {
    if (event.type === "goalFor" && event.goalPlayerId && playerIds.has(event.goalPlayerId)) {
      const aggregate = ensureAggregate(results, event.goalPlayerId);
      aggregate.goals += 1;
      aggregate.points += 1;
      if (event.strength === "PP") {
        aggregate.powerPlayGoals += 1;
      }
      if (event.strength === "SH") {
        aggregate.shortHandedGoals += 1;
      }
    }

    if (
      event.type === "penalty" &&
      event.penaltyPlayerId &&
      playerIds.has(event.penaltyPlayerId) &&
      event.penaltyMinutes
    ) {
      const aggregate = ensureAggregate(results, event.penaltyPlayerId);
      aggregate.penaltyMinutes += event.penaltyMinutes;
    }

    if (event.type === "goalFor") {
      event.assistIds
        ?.filter((assistId) => playerIds.has(assistId))
        .forEach((assistId) => {
          const aggregate = ensureAggregate(results, assistId);
          aggregate.assists += 1;
          aggregate.points += 1;
        });

      event.plusPlayerIds
        ?.filter((id) => playerIds.has(id))
        .forEach((playerId) => {
          const aggregate = ensureAggregate(results, playerId);
          aggregate.plusMinus += 1;
        });
    }

    if (event.type === "goalAgainst") {
      event.minusPlayerIds
        ?.filter((id) => playerIds.has(id))
        .forEach((playerId) => {
          const aggregate = ensureAggregate(results, playerId);
          aggregate.plusMinus -= 1;
        });
    }
  });

  return players.map((player) => ensureAggregate(results, player.id));
};
