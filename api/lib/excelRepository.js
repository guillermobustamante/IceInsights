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
const columnLettersToNumber = (letters) =>
  letters
    .toUpperCase()
    .split("")
    .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0);

const columnNumberToLetters = (number) => {
  let value = number;
  let letters = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters;
};

const parseCellReference = (reference) => ({
  column: reference.replace(/\d+/g, ""),
  row: Number(reference.replace(/\D+/g, "")),
});

const padRowValues = (row, length) => {
  if (row.length >= length) {
    return row;
  }
  const padded = row.slice();
  while (padded.length < length) {
    padded.push("");
  }
  return padded;
};

const buildRangeAddress = (
  sheetName,
  startColumn,
  startRow,
  columnCount,
  rowCount
) => {
  const startColumnNumber = columnLettersToNumber(startColumn);
  const endColumn = columnNumberToLetters(startColumnNumber + columnCount - 1);
  const endRow = startRow + rowCount - 1;
  return `${sheetName}!${startColumn}${startRow}:${endColumn}${endRow}`;
};

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

const replaceTableRows = async (client, driveId, itemId, tablePath, rows) => {
  const table = await client
    .api(`${tablePath}?$expand=worksheet($select=id)`)
    .get();

  const worksheetId = table?.worksheet?.id;
  if (!worksheetId) {
    throw new Error(`Unable to resolve worksheet for table at path ${tablePath}`);
  }

  const headerRange = await client.api(`${tablePath}/headerRowRange`).get();
  const headerAddressParts = headerRange.address.split("!");
  const sheetName = headerAddressParts[0];
  const [headerStartRef] = headerAddressParts[1].split(":");
  const { column: startColumn, row: headerRow } = parseCellReference(
    headerStartRef
  );

  const columnCount =
    headerRange.columnCount ??
    (headerRange.values?.[0]?.length ?? (rows[0]?.length ?? 0));
  if (!columnCount) {
    throw new Error(`Unable to determine column count for table at path ${tablePath}`);
  }

  const headerValues = padRowValues(headerRange.values?.[0] ?? [], columnCount);
  const sanitizedRows = rows.map((row) => padRowValues(row, columnCount));

  const targetRangeAddress = buildRangeAddress(
    sheetName,
    startColumn,
    headerRow,
    columnCount,
    sanitizedRows.length + 1
  );
  const encodedTargetRange = encodeURIComponent(targetRangeAddress);

  await client
    .api(`${tablePath}/dataBodyRange`)
    .get()
    .then(async (existingRange) => {
      if (!existingRange?.address) {
        return;
      }
      const encodedExisting = encodeURIComponent(existingRange.address);
      await client
        .api(
          `/drives/${driveId}/items/${itemId}/workbook/worksheets/${worksheetId}/range(address='${encodedExisting}')/clear`
        )
        .post({ applyTo: "Contents" });
    })
    .catch(() => undefined);

  const values = [headerValues, ...sanitizedRows];

  await client
    .api(
      `/drives/${driveId}/items/${itemId}/workbook/worksheets/${worksheetId}/range(address='${encodedTargetRange}')`
    )
    .patch({ values });

  await client
    .api(`${tablePath}/resize`)
    .post({ address: targetRangeAddress });
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
    replaceTableRows(
      client,
      driveId,
      itemId,
      rosterPath,
      tableRowsFromPlayers(players)
    ),
    replaceTableRows(
      client,
      driveId,
      itemId,
      gamesPath,
      tableRowsFromGames(games)
    ),
    replaceTableRows(
      client,
      driveId,
      itemId,
      eventsPath,
      tableRowsFromEvents(events)
    ),
  ]);
};

module.exports = {
  getWorkbookData,
  saveWorkbookData,
};













