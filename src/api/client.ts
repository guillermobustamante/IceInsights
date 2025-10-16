import type { GameEvent, GameSummary, Player } from "../types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL !== ""
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")
    : "/api";

interface PersistPayload {
  players: Player[];
  games: GameSummary[];
  events: GameEvent[];
}

type LoadResponse = PersistPayload;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const detail = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(detail.message ?? "Unexpected API error.");
  }
  return response;
};

export const loadData = async (): Promise<LoadResponse> => {
  const response = await handleResponse(
    await fetch(`${API_BASE}/get-data`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
  );

  return response.json();
};

export const persistData = async (payload: PersistPayload): Promise<void> => {
  await handleResponse(
    await fetch(`${API_BASE}/save-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  );
};
