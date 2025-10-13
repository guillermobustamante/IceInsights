import { create } from "zustand";
import type { GameEvent, GameSummary, Player } from "../types";

export interface EventStore {
  players: Player[];
  games: GameSummary[];
  events: GameEvent[];
  selectedGameId: string;
  addPlayer: (player: Omit<Player, "id">) => void;
  updatePlayer: (playerId: string, patch: Partial<Player>) => void;
  deletePlayer: (playerId: string) => void;
  addGame: (game: Omit<GameSummary, "id">) => void;
  updateGame: (gameId: string, patch: Partial<GameSummary>) => void;
  deleteGame: (gameId: string) => void;
  addEvent: (event: Omit<GameEvent, "id" | "createdAt">) => void;
  updateEvent: (eventId: string, patch: Partial<GameEvent>) => void;
  deleteEvent: (eventId: string) => void;
  selectGame: (gameId: string) => void;
}

const defaultPlayers: Player[] = [
  { id: "p1", number: 9, name: "Alex Mercer", position: "C" },
  { id: "p2", number: 27, name: "Jordan Price", position: "LW" },
  { id: "p3", number: 12, name: "Mason Lee", position: "RW" },
  { id: "p4", number: 4, name: "Theo Grant", position: "D" },
  { id: "p5", number: 33, name: "Evan Blake", position: "D" },
];

const defaultGames: GameSummary[] = [
  {
    id: "game-001",
    opponent: "Ice Hawks",
    date: new Date().toISOString(),
    status: "live",
  },
  {
    id: "game-002",
    opponent: "Polar Kings",
    date: new Date().toISOString(),
    status: "final",
  },
];

const defaultEvents: GameEvent[] = [
  {
    id: "evt-001",
    gameId: "game-001",
    createdAt: new Date().toISOString(),
    period: 1,
    clock: "12:34",
    type: "goalFor",
    strength: "EVEN",
    goalPlayerId: "p1",
    assistIds: ["p2", "p3"],
    plusPlayerIds: ["p1", "p2", "p3", "p4"],
    minusPlayerIds: [],
    notes: "Bar down on the rush",
  },
  {
    id: "evt-002",
    gameId: "game-001",
    createdAt: new Date().toISOString(),
    period: 1,
    clock: "05:10",
    type: "penalty",
    strength: "EVEN",
    goalPlayerId: undefined,
    assistIds: [],
    plusPlayerIds: [],
    minusPlayerIds: [],
    penaltyPlayerId: "p4",
    penaltyInfraction: "Tripping",
    penaltySeverity: "Minor",
    penaltyMinutes: 2,
    notes: "Defensive zone stick trip",
  },
  {
    id: "evt-003",
    gameId: "game-002",
    createdAt: new Date().toISOString(),
    period: 3,
    clock: "03:55",
    type: "goalAgainst",
    strength: "PP",
    goalPlayerId: undefined,
    assistIds: [],
    plusPlayerIds: [],
    minusPlayerIds: ["p4", "p5"],
    notes: "Screen in front of the net",
  },
];

const randomId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2));

const sanitizeEvent = (event: GameEvent): GameEvent => ({
  ...event,
  assistIds: Array.from(new Set(event.assistIds ?? [])),
  plusPlayerIds: Array.from(new Set(event.plusPlayerIds ?? [])),
  minusPlayerIds: Array.from(new Set(event.minusPlayerIds ?? [])),
});

export const useEventStore = create<EventStore>((set, get) => ({
  players: defaultPlayers,
  games: defaultGames,
  events: defaultEvents.map(sanitizeEvent),
  selectedGameId: defaultGames[0]?.id ?? "",
  addPlayer: (player) => {
    set((state) => ({
      players: [...state.players, { ...player, id: randomId() }],
    }));
  },
  updatePlayer: (playerId, patch) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, ...patch } : player
      ),
      events: state.events.map((event) =>
        event.goalPlayerId === playerId
          ? sanitizeEvent({ ...event, goalPlayerId: patch.name ? playerId : event.goalPlayerId })
          : event
      ),
    }));
  },
  deletePlayer: (playerId) => {
    set((state) => ({
      players: state.players.filter((player) => player.id !== playerId),
      events: state.events.map((event) =>
        sanitizeEvent({
          ...event,
          assistIds: event.assistIds.filter((id) => id !== playerId),
          plusPlayerIds: event.plusPlayerIds.filter((id) => id !== playerId),
          minusPlayerIds: event.minusPlayerIds.filter((id) => id !== playerId),
          goalPlayerId: event.goalPlayerId === playerId ? undefined : event.goalPlayerId,
          penaltyPlayerId: event.penaltyPlayerId === playerId ? undefined : event.penaltyPlayerId,
        })
      ),
    }));
  },
  addGame: (game) => {
    const newGame: GameSummary = { ...game, id: randomId() };
    set((state) => ({
      games: [newGame, ...state.games],
      selectedGameId: state.selectedGameId || newGame.id,
    }));
  },
  updateGame: (gameId, patch) => {
    set((state) => ({
      games: state.games.map((game) =>
        game.id === gameId ? { ...game, ...patch } : game
      ),
    }));
  },
  deleteGame: (gameId) => {
    set((state) => {
      const games = state.games.filter((game) => game.id !== gameId);
      const events = state.events.filter((event) => event.gameId !== gameId);
      const selectedGameId = state.selectedGameId === gameId ? games[0]?.id ?? "" : state.selectedGameId;
      return { games, events, selectedGameId };
    });
  },
  addEvent: (event) => {
    const newEvent: GameEvent = sanitizeEvent({
      ...event,
      id: randomId(),
      createdAt: new Date().toISOString(),
    } as GameEvent);
    set((state) => ({ events: [newEvent, ...state.events] }));
  },
  updateEvent: (eventId, patch) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId ? sanitizeEvent({ ...event, ...patch }) : event
      ),
    }));
  },
  deleteEvent: (eventId) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== eventId),
    }));
  },
  selectGame: (gameId) => {
    if (!gameId) {
      return;
    }
    const exists = get().games.some((game) => game.id === gameId);
    if (!exists) {
      return;
    }
    set((state) =>
      state.selectedGameId === gameId
        ? state
        : { selectedGameId: gameId }
    );
  },
}));






