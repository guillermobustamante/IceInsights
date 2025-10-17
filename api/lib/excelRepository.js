const { createGraphClient } = require("./graphClient");

const requiredEnv = [
  "WORKBOOK_DRIVE_ID",
  "WORKBOOK_ITEM_ID",
  "ROSTER_TABLE",
  "EVENTS_TABLE",
  "GAMES_TABLE",
];

const getEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const readEnv = () => {
  requiredEnv.forEach(getEnv);
  return {
    driveId: getEnv("WORKBOOK_DRIVE_ID"),
    itemId: getEnv("WORKBOOK_ITEM_ID"),
    rosterTable: getEnv("ROSTER_TABLE"),
    eventsTable: getEnv("EVENTS_TABLE"),
    gamesTable: getEnv("GAMES_TABLE"),
  };
};

const PLAYER_COLUMNS = ["PlayerId", "number", "name", "position"];
const GAME_COLUMNS = ["GameId", "opponent", "date", "status"];
const EVENT_COLUMNS = [
  "EventId",
  "GameId",
  "createdAt",
  "period",
  "clock",
  "type",
  "strength",
  "goalPlayerId",
  "assistIds",
  "plusPlayerIds",
  "minusPlayerIds",
  "penaltyPlayerId",
  "penaltyInfraction",
  "penaltySeverity",
  "penaltyMinutes",
  "notes",
];

const parseNumber = (value) =>
  value === undefined || value === null || value === ""
    ? undefined
    : Number(value);

const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const stringifyArray = (value) =>
  Array.isArray(value) && value.length > 0 ? JSON.stringify(value) : "";

const asCell = (value) =>
  value === undefined || value === null ? "" : String(value);

const buildTablePath = (driveId, itemId, tableName, suffix = "") =>
  `/drives/${driveId}/items/${itemId}/workbook/tables('${tableName}')${suffix}`;

const fetchColumnNames = async (client, tablePath) => {
  const result = await client.api(`${tablePath}/columns`).get();
  return result.value.map((column) => column.name);
};

const fetchTableRows = async (client, tablePath) => {
  const result = await client.api(`${tablePath}/rows?$select=values`).get();
  return result.value || [];
};

const ensureColumns = (expected, actual, tableName) => {
  const normalizedActual = new Set(
    actual.map((column) => column.toLowerCase().trim())
  );
  const missing = expected.filter(
    (col) => !normalizedActual.has(col.toLowerCase().trim())
  );
  if (missing.length > 0) {
    throw new Error(
      `Table ${tableName} is missing expected columns: ${missing.join(", ")}`
    );
  }
};

const normalizeRow = (columns, values) => {
  const object = {};
  columns.forEach((column, index) => {
    object[column] = values[index];
    const normalized = column.toLowerCase().trim();
    if (!(normalized in object)) {
      object[normalized] = values[index];
    }
  });
  return object;
};

const getRowValue = (row, key) => {
  if (Object.prototype.hasOwnProperty.call(row, key)) {
    return row[key];
  }
  const normalized = key.toLowerCase().trim();
  if (Object.prototype.hasOwnProperty.call(row, normalized)) {
    return row[normalized];
  }
  return undefined;
};
const toPlayer = (row) => ({
  id: getRowValue(row, "PlayerId"),
  number: parseNumber(getRowValue(row, "number")) ?? 0,
  name: getRowValue(row, "name"),
  position: getRowValue(row, "position"),
});

const toGame = (row) => ({
  id: getRowValue(row, "GameId"),
  opponent: getRowValue(row, "opponent"),
  date: getRowValue(row, "date"),
  status: getRowValue(row, "status"),
});

const toEvent = (row) => ({
  id: getRowValue(row, "EventId"),
  gameId: getRowValue(row, "GameId"),
  createdAt: getRowValue(row, "createdAt"),
  period: parseNumber(getRowValue(row, "period")) ?? 0,
  clock: getRowValue(row, "clock"),
  type: getRowValue(row, "type"),
  strength: getRowValue(row, "strength"),
  goalPlayerId: getRowValue(row, "goalPlayerId") || undefined,
  assistIds: parseJsonArray(getRowValue(row, "assistIds")),
  plusPlayerIds: parseJsonArray(getRowValue(row, "plusPlayerIds")),
  minusPlayerIds: parseJsonArray(getRowValue(row, "minusPlayerIds")),
  penaltyPlayerId: getRowValue(row, "penaltyPlayerId") || undefined,
  penaltyInfraction: getRowValue(row, "penaltyInfraction") || undefined,
  penaltySeverity: getRowValue(row, "penaltySeverity") || undefined,
  penaltyMinutes: parseNumber(getRowValue(row, "penaltyMinutes")),
  notes: getRowValue(row, "notes") || "",
});

const tableRowsFromPlayers = (players) =>
  players.map((player) => [
    asCell(player.id),
    asCell(player.number),
    asCell(player.name),
    asCell(player.position),
  ]);

const tableRowsFromGames = (games) =>
  games.map((game) => [
    asCell(game.id),
    asCell(game.opponent),
    asCell(game.date),
    asCell(game.status),
  ]);

const tableRowsFromEvents = (events) =>
  events.map((event) => [
    asCell(event.id),
    asCell(event.gameId),
    asCell(event.createdAt),
    asCell(event.period),
    asCell(event.clock),
    asCell(event.type),
    asCell(event.strength),
    asCell(event.goalPlayerId),
    stringifyArray(event.assistIds),
    stringifyArray(event.plusPlayerIds),
    stringifyArray(event.minusPlayerIds),
    asCell(event.penaltyPlayerId),
    asCell(event.penaltyInfraction),
    asCell(event.penaltySeverity),
    asCell(event.penaltyMinutes),
    asCell(event.notes),
  ]);

const clearTable = async (client, tablePath) => {
  const rows = await client.api(`${tablePath}/rows?$select=index`).get();
  const deletePromises = [];

  if (Array.isArray(rows.value)) {
    const sortedIndexes = rows.value
      .map((row, position) =>
        typeof row.index === "number" ? row.index : position
      )
      .sort((a, b) => b - a);

    for (const rowIndex of sortedIndexes) {
      deletePromises.push(
        client.api(`${tablePath}/rows/${rowIndex}/delete`).post()
      );
    }
  }

  await Promise.all(deletePromises);
};

const appendRows = async (client, tablePath, rows) => {
  if (rows.length === 0) {
    return;
  }

  await client.api(`${tablePath}/rows/add`).post({
    values: rows,
  });
};

const getWorkbookData = async () => {
  const { driveId, itemId, rosterTable, eventsTable, gamesTable } = readEnv();
  const client = createGraphClient();

  const rosterPath = buildTablePath(driveId, itemId, rosterTable);
  const gamesPath = buildTablePath(driveId, itemId, gamesTable);
  const eventsPath = buildTablePath(driveId, itemId, eventsTable);

  const [
    rosterColumns,
    rosterRows,
    gamesColumns,
    gamesRows,
    eventsColumns,
    eventsRows,
  ] = await Promise.all([
    fetchColumnNames(client, rosterPath),
    fetchTableRows(client, rosterPath),
    fetchColumnNames(client, gamesPath),
    fetchTableRows(client, gamesPath),
    fetchColumnNames(client, eventsPath),
    fetchTableRows(client, eventsPath),
  ]);

  ensureColumns(PLAYER_COLUMNS, rosterColumns, rosterTable);
  ensureColumns(GAME_COLUMNS, gamesColumns, gamesTable);
  ensureColumns(EVENT_COLUMNS, eventsColumns, eventsTable);

  const players = rosterRows.map((row) =>
    toPlayer(normalizeRow(rosterColumns, row.values?.[0] ?? []))
  );
  const games = gamesRows.map((row) =>
    toGame(normalizeRow(gamesColumns, row.values?.[0] ?? []))
  );
  const events = eventsRows.map((row) =>
    toEvent(normalizeRow(eventsColumns, row.values?.[0] ?? []))
  );

  return { players, games, events };
};

const saveWorkbookData = async ({ players, games, events }) => {
  const { driveId, itemId, rosterTable, eventsTable, gamesTable } = readEnv();
  const client = createGraphClient();

  const rosterPath = buildTablePath(driveId, itemId, rosterTable);
  const gamesPath = buildTablePath(driveId, itemId, gamesTable);
  const eventsPath = buildTablePath(driveId, itemId, eventsTable);

  await Promise.all([
    clearTable(client, rosterPath),
    clearTable(client, gamesPath),
    clearTable(client, eventsPath),
  ]);

  await Promise.all([
    appendRows(client, rosterPath, tableRowsFromPlayers(players)),
    appendRows(client, gamesPath, tableRowsFromGames(games)),
    appendRows(client, eventsPath, tableRowsFromEvents(events)),
  ]);
};

module.exports = {
  getWorkbookData,
  saveWorkbookData,
};








