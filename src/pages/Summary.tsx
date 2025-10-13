import { useMemo } from "react";
import {
  Box,
  Heading,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useEventStore } from "../store/useEventStore";
import { computeAggregates } from "../utils/stats";

export const Summary = () => {
  const players = useEventStore((state) => state.players);
  const events = useEventStore((state) => state.events);

  const aggregates = useMemo(() => computeAggregates(players, events), [players, events]);
  const playerMap = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);

  return (
    <Box>
      <Heading size="md" mb={4}>
        Season Totals
      </Heading>
      <Box overflowX="auto" borderRadius="lg" borderWidth={1} borderColor="gray.700">
        <Table size="sm" variant="simple">
          <Thead bg="gray.800">
            <Tr>
              <Th color="gray.300">Player</Th>
              <Th isNumeric color="gray.300">
                G
              </Th>
              <Th isNumeric color="gray.300">
                A
              </Th>
              <Th isNumeric color="gray.300">
                PTS
              </Th>
              <Th isNumeric color="gray.300">
                +/-
              </Th>
              <Th isNumeric color="gray.300">
                PP
              </Th>
              <Th isNumeric color="gray.300">
                SH
              </Th>
              <Th isNumeric color="gray.300">
                PIM
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {aggregates.map((aggregate) => {
              const player = playerMap.get(aggregate.playerId);
              if (!player) {
                return null;
              }
              return (
                <Tr key={aggregate.playerId}>
                  <Td>
                    #{player.number} {player.name}
                  </Td>
                  <Td isNumeric>{aggregate.goals}</Td>
                  <Td isNumeric>{aggregate.assists}</Td>
                  <Td isNumeric>{aggregate.points}</Td>
                  <Td isNumeric>{aggregate.plusMinus}</Td>
                  <Td isNumeric>{aggregate.powerPlayGoals}</Td>
                  <Td isNumeric>{aggregate.shortHandedGoals}</Td>
                  <Td isNumeric>{aggregate.penaltyMinutes}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
