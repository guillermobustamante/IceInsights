import { useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { FocusableElement } from "@chakra-ui/utils";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FiPlusCircle } from "react-icons/fi";
import { EventComposerDrawer } from "../components/EventComposerDrawer";
import { EventCard } from "../components/EventCard";
import { useEventStore } from "../store/useEventStore";
import { computeAggregates, sortEventsByCreatedDesc } from "../utils/stats";
import type { GameEvent } from "../types";

export const Dashboard = () => {
  const composerDisclosure = useDisclosure();
  const confirmDisclosure = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const events = useEventStore((state) => state.events);
  const players = useEventStore((state) => state.players);
  const games = useEventStore((state) => state.games);
  const selectedGameId = useEventStore((state) => state.selectedGameId);
  const deleteEvent = useEventStore((state) => state.deleteEvent);

  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [eventPendingDelete, setEventPendingDelete] = useState<GameEvent | null>(null);

  const currentEvents = useMemo(() => {
    return sortEventsByCreatedDesc(
      events.filter((event) => event.gameId === selectedGameId)
    );
  }, [events, selectedGameId]);

  const aggregates = useMemo(() => {
    return computeAggregates(players, currentEvents);
  }, [players, currentEvents]);

  const activeGame = useMemo(
    () => games.find((game) => game.id === selectedGameId),
    [games, selectedGameId]
  );

  const handleAddEvent = () => {
    setActiveEvent(null);
    composerDisclosure.onOpen();
  };

  const handleEditEvent = (event: GameEvent) => {
    setActiveEvent(event);
    composerDisclosure.onOpen();
  };

  const handleCloseComposer = () => {
    setActiveEvent(null);
    composerDisclosure.onClose();
  };

  const requestDeleteEvent = (event: GameEvent) => {
    setEventPendingDelete(event);
    confirmDisclosure.onOpen();
  };

  const confirmDeleteEvent = () => {
    if (eventPendingDelete) {
      deleteEvent(eventPendingDelete.id);
      toast({ title: "Event removed", status: "info" });
    }
    setEventPendingDelete(null);
    confirmDisclosure.onClose();
  };

  const cancelDelete = () => {
    setEventPendingDelete(null);
    confirmDisclosure.onClose();
  };

  return (
    <Box position="relative" pb={16}>
      <Heading size="md" mb={4}>
        {activeGame ? `vs ${activeGame.opponent}` : "Live Game"}
      </Heading>

      <SimpleGrid columns={2} spacing={3} mb={6}>
        <Stat bg="gray.800" p={3} borderRadius="lg">
          <StatLabel fontSize="xs" textTransform="uppercase" color="gray.400">
            Goals
          </StatLabel>
          <StatNumber fontSize="xl">
            {aggregates.reduce((total, player) => total + player.goals, 0)}
          </StatNumber>
        </Stat>
        <Stat bg="gray.800" p={3} borderRadius="lg">
          <StatLabel fontSize="xs" textTransform="uppercase" color="gray.400">
            Assists
          </StatLabel>
          <StatNumber fontSize="xl">
            {aggregates.reduce((total, player) => total + player.assists, 0)}
          </StatNumber>
        </Stat>
        <Stat bg="gray.800" p={3} borderRadius="lg">
          <StatLabel fontSize="xs" textTransform="uppercase" color="gray.400">
            Power Play Goals
          </StatLabel>
          <StatNumber fontSize="lg">
            {aggregates.reduce((total, player) => total + player.powerPlayGoals, 0)}
          </StatNumber>
        </Stat>
        <Stat bg="gray.800" p={3} borderRadius="lg">
          <StatLabel fontSize="xs" textTransform="uppercase" color="gray.400">
            PIM
          </StatLabel>
          <StatNumber fontSize="lg">
            {aggregates.reduce((total, player) => total + player.penaltyMinutes, 0)}
          </StatNumber>
          <StatHelpText>Current game</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Heading size="sm" mb={3}>
        Live Event Feed
      </Heading>
      <Flex direction="column" gap={3}>
        {currentEvents.length === 0 ? (
          <Text color="gray.400">No events yet. Tap the + button to add the first event.</Text>
        ) : (
          currentEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              players={players}
              onEdit={handleEditEvent}
              onDelete={requestDeleteEvent}
            />
          ))
        )}
      </Flex>

      <Button
        position="fixed"
        bottom="80px"
        right="24px"
        colorScheme="brand"
        borderRadius="full"
        size="lg"
        shadow="lg"
        leftIcon={<Icon as={FiPlusCircle} />}
        onClick={handleAddEvent}
      >
        Add Event
      </Button>

      <EventComposerDrawer
        isOpen={composerDisclosure.isOpen}
        onClose={handleCloseComposer}
        event={activeEvent}
      />

      <AlertDialog
        isOpen={confirmDisclosure.isOpen}
        leastDestructiveRef={cancelRef as unknown as RefObject<FocusableElement>}
        onClose={cancelDelete}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete event
            </AlertDialogHeader>

            <AlertDialogBody>
              This will permanently remove the event from your stats log. Are you sure?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={cancelDelete}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDeleteEvent} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};






