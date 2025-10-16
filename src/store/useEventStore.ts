import { create } from "zustand";
import { loadData, persistData } from "../api/client";
import type { GameEvent, GameSummary, Player } from "../types";

export interface EventStore {
  players: Player[];
  games: GameSummary[];
  events: GameEvent[];
  selectedGameId: string;
  hasLoaded: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  clearError: () => void;
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
  persist: () => Promise<void>;
}

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
  players: [],
  games: [],
  events: [],
  selectedGameId: "",
  hasLoaded: false,
  isLoading: false,
  isSaving: false,
  error: null,
  initialize: async () => {
    if (get().isLoading || get().hasLoaded) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const data = await loadData();
      const games = data.games ?? [];
      const events = (data.events ?? []).map(sanitizeEvent);
      set({
        players: data.players ?? [],
        games,
        events,
        selectedGameId:
          games[0]?.id ?? events[0]?.gameId ?? get().selectedGameId ?? "",
        hasLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load data.";
      set({ error: message, isLoading: false });
    }
  },
  clearError: () => set({ error: null }),
  persist: async () => {
    if (!get().hasLoaded) {
      return;
    }
    set({ isSaving: true });
    try {
      const state = get();
      await persistData({
        players: state.players,
        games: state.games,
        events: state.events,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save data.";
      set({ error: message });
      throw error;
    } finally {
      set({ isSaving: false });
    }
  },
  addPlayer: (player) => {
    set((state) => ({
      players: [...state.players, { ...player, id: randomId() }],
    }));
    void get()
      .persist()
      .catch(() => undefined);
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
    void get()
      .persist()
      .catch(() => undefined);
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
    void get()
      .persist()
      .catch(() => undefined);
  },
  addGame: (game) => {
    const newGame: GameSummary = { ...game, id: randomId() };
    set((state) => ({
      games: [newGame, ...state.games],
      selectedGameId: state.selectedGameId || newGame.id,
    }));
    void get()
      .persist()
      .catch(() => undefined);
  },
  updateGame: (gameId, patch) => {
    set((state) => ({
      games: state.games.map((game) =>
        game.id === gameId ? { ...game, ...patch } : game
      ),
    }));
    void get()
      .persist()
      .catch(() => undefined);
  },
  deleteGame: (gameId) => {
    set((state) => {
      const games = state.games.filter((game) => game.id !== gameId);
      const events = state.events.filter((event) => event.gameId !== gameId);
      const selectedGameId = state.selectedGameId === gameId ? games[0]?.id ?? "" : state.selectedGameId;
      return { games, events, selectedGameId };
    });
    void get()
      .persist()
      .catch(() => undefined);
  },
  addEvent: (event) => {
    const newEvent: GameEvent = sanitizeEvent({
      ...event,
      id: randomId(),
      createdAt: new Date().toISOString(),
    } as GameEvent);
    set((state) => ({ events: [newEvent, ...state.events] }));
    void get()
      .persist()
      .catch(() => undefined);
  },
  updateEvent: (eventId, patch) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId ? sanitizeEvent({ ...event, ...patch }) : event
      ),
    }));
    void get()
      .persist()
      .catch(() => undefined);
  },
  deleteEvent: (eventId) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== eventId),
    }));
    void get()
      .persist()
      .catch(() => undefined);
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
