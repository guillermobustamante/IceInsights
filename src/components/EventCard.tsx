import {
  Badge,
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiEdit2, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import type { GameEvent, Player } from "../types";

interface EventCardProps {
  event: GameEvent;
  players: Player[];
  onEdit: (event: GameEvent) => void;
  onDelete: (event: GameEvent) => void;
}

const strengthLabels: Record<GameEvent["strength"], string> = {
  EVEN: "Even Strength",
  PP: "Power Play",
  SH: "Short-handed",
};

const typeMeta: Record<Exclude<GameEvent["type"], undefined>, { label: string; colorScheme: string }> = {
  goalFor: { label: "Goal", colorScheme: "green" },
  goalAgainst: { label: "Goal Against", colorScheme: "red" },
  penalty: { label: "Penalty", colorScheme: "orange" },
};

const formatPlayerList = (players: Player[]): string =>
  players.map((player) => `#${player.number} ${player.name.split(" ")[0]}`).join(", ");

export const EventCard = ({ event, players, onEdit, onDelete }: EventCardProps) => {
  const accent = useColorModeValue("gray.100", "gray.700");
  const meta = typeMeta[event.type];
  const playerMap = new Map(players.map((player) => [player.id, player]));
  const primaryPlayer = event.goalPlayerId ? playerMap.get(event.goalPlayerId) : null;
  const assists = event.assistIds
    ?.map((id) => playerMap.get(id))
    .filter(Boolean) as Player[];
  const plusPlayers = event.plusPlayerIds
    ?.map((id) => playerMap.get(id))
    .filter(Boolean) as Player[];
  const minusPlayers = event.minusPlayerIds
    ?.map((id) => playerMap.get(id))
    .filter(Boolean) as Player[];
  const penaltyPlayer = event.penaltyPlayerId ? playerMap.get(event.penaltyPlayerId) : null;

  return (
    <Card bg={accent} borderRadius="lg" shadow="sm">
      <CardBody>
        <Stack spacing={3}>
          <Flex align="center" justify="space-between">
            <Badge
              colorScheme={meta.colorScheme}
              display="flex"
              alignItems="center"
              gap={2}
              px={3}
              py={1}
              borderRadius="full"
              textTransform="uppercase"
              fontSize="0.7rem"
            >
              {meta.label}
            </Badge>
            <Flex align="center" gap={3}>
              <Text fontSize="sm" color="gray.400">
                P{event.period} • {event.clock}
              </Text>
              <Menu>
                <MenuButton
                  as={IconButton}
                  variant="ghost"
                  size="sm"
                  aria-label="Event actions"
                  icon={<FiMoreVertical />}
                />
                <MenuList>
                  <MenuItem icon={<FiEdit2 />} onClick={() => onEdit(event)}>
                    Edit event
                  </MenuItem>
                  <MenuItem icon={<FiTrash2 />} color="red.400" onClick={() => onDelete(event)}>
                    Delete event
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>

          {primaryPlayer && event.type === "goalFor" && (
            <Heading size="sm">
              #{primaryPlayer.number} {primaryPlayer.name}
            </Heading>
          )}

          {assists && assists.length > 0 && event.type === "goalFor" && (
            <Text fontSize="sm" color="gray.300">
              Assists: {formatPlayerList(assists)}
            </Text>
          )}

          {event.type === "penalty" && penaltyPlayer && (
            <Text fontSize="sm" color="gray.300">
              Penalized: #{penaltyPlayer.number} {penaltyPlayer.name}
            </Text>
          )}

          <Flex align="center" gap={3} wrap="wrap">
            <Badge colorScheme="purple">{strengthLabels[event.strength]}</Badge>
            {event.type === "penalty" && event.penaltyInfraction && (
              <Badge colorScheme="red">{event.penaltyInfraction}</Badge>
            )}
            {event.type === "penalty" && event.penaltyMinutes ? (
              <Badge colorScheme="red">{event.penaltyMinutes} min</Badge>
            ) : null}
          </Flex>

          {event.type !== "penalty" && (
            <Box fontSize="sm" color="gray.300">
              {event.type === "goalFor" && plusPlayers.length > 0 && (
                <Box>
                  <Text as="span" fontWeight="semibold" color="green.300">
                    +
                  </Text>{" "}
                  {formatPlayerList(plusPlayers)}
                </Box>
              )}
              {event.type === "goalAgainst" && minusPlayers.length > 0 && (
                <Box>
                  <Text as="span" fontWeight="semibold" color="red.300">
                    -
                  </Text>{" "}
                  {formatPlayerList(minusPlayers)}
                </Box>
              )}
            </Box>
          )}

          {event.notes && (
            <Box fontSize="sm" color="gray.300">
              {event.notes}
            </Box>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};










