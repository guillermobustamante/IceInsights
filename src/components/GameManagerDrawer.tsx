import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { FocusableElement } from "@chakra-ui/utils";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useEventStore } from "../store/useEventStore";
import type { GameSummary } from "../types";

type GameSummaryStatus = "live" | "final" | "scheduled";

interface GameManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const toLocalInputValue = (iso: string | undefined) => {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const toIsoString = (value: string) => {
  if (!value) {
    return new Date().toISOString();
  }
  const date = new Date(value);
  return date.toISOString();
};

export const GameManagerDrawer = ({ isOpen, onClose }: GameManagerDrawerProps) => {
  const games = useEventStore((state) => state.games);
  const addGame = useEventStore((state) => state.addGame);
  const updateGame = useEventStore((state) => state.updateGame);
  const deleteGame = useEventStore((state) => state.deleteGame);
  const selectedGameId = useEventStore((state) => state.selectedGameId);

  const toast = useToast();
  const confirmDisclosure = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [gamePendingDelete, setGamePendingDelete] = useState<string | null>(null);

  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [status, setStatus] = useState<GameSummaryStatus>("scheduled");

  const resetForm = () => {
    setEditingGameId(null);
    setOpponent("");
    setDateInput("");
    setStatus("scheduled");
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!editingGameId) {
      return;
    }
    const game = games.find((item) => item.id === editingGameId);
    if (!game) {
      resetForm();
      return;
    }
    setOpponent(game.opponent);
    setDateInput(toLocalInputValue(game.date));
    setStatus((game.status as GameSummaryStatus) ?? "scheduled");
  }, [editingGameId, games]);

  const sortedGames = useMemo(
    () => [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [games]
  );

  const handleSubmit = () => {
    if (!opponent) {
      toast({ title: "Opponent required", status: "warning" });
      return;
    }

    const payload: Omit<GameSummary, "id"> = {
      opponent,
      date: toIsoString(dateInput),
      status,
    };

    if (editingGameId) {
      updateGame(editingGameId, payload);
      toast({ title: "Game updated", status: "success" });
    } else {
      addGame(payload);
      toast({ title: "Game added", status: "success" });
    }

    resetForm();
  };

  const handleEdit = (gameId: string) => {
    setEditingGameId(gameId);
  };

  const requestDelete = (gameId: string) => {
    setGamePendingDelete(gameId);
    confirmDisclosure.onOpen();
  };

  const confirmDelete = () => {
    if (gamePendingDelete) {
      deleteGame(gamePendingDelete);
      toast({ title: "Game removed", status: "info" });
    }
    setGamePendingDelete(null);
    confirmDisclosure.onClose();
  };

  const cancelDelete = () => {
    setGamePendingDelete(null);
    confirmDisclosure.onClose();
  };

  return (
    <>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Manage Games
          </DrawerHeader>

          <DrawerBody>
            <Stack spacing={6}>
              <Stack spacing={4}>
                <Heading size="sm">
                  {editingGameId ? "Edit game" : "Add game"}
                </Heading>
                <FormControl isRequired>
                  <FormLabel>Opponent</FormLabel>
                  <Input value={opponent} onChange={(event) => setOpponent(event.target.value)} placeholder="Polar Kings" />
                </FormControl>
                <FormControl>
                  <FormLabel>Game date and time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={dateInput}
                    onChange={(event) => setDateInput(event.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select value={status} onChange={(event) => setStatus(event.target.value as GameSummaryStatus)}>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="final">Final</option>
                  </Select>
                </FormControl>
                <Button colorScheme="brand" onClick={handleSubmit}>
                  {editingGameId ? "Save changes" : "Add game"}
                </Button>
                {editingGameId && (
                  <Button variant="ghost" onClick={resetForm}>
                    Cancel edit
                  </Button>
                )}
              </Stack>

              <Stack spacing={3}>
                <Heading size="sm">Existing games</Heading>
                {sortedGames.length === 0 && (
                  <Text fontSize="sm" color="gray.500">
                    Add your first game to start tracking events.
                  </Text>
                )}
                <VStack align="stretch" spacing={3}>
                  {sortedGames.map((game) => (
                    <Stack
                      key={game.id}
                      spacing={1}
                      borderWidth={1}
                      borderColor="gray.700"
                      borderRadius="lg"
                      p={3}
                    >
                      <Heading size="sm">vs {game.opponent}</Heading>
                      <Text fontSize="sm" color="gray.400">
                        {new Date(game.date).toLocaleString()} - {game.status.toUpperCase()}
                      </Text>
                      <Stack direction="row" spacing={3} pt={2}>
                        <Button
                          size="sm"
                          leftIcon={<FiEdit2 />}
                          onClick={() => handleEdit(game.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<FiTrash2 />}
                          colorScheme="red"
                          onClick={() => requestDelete(game.id)}
                        >
                          Delete
                        </Button>
                        {selectedGameId === game.id && (
                          <Button size="sm" variant="ghost" isDisabled>
                            Active game
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  ))}
                </VStack>
              </Stack>
            </Stack>
          </DrawerBody>

          <DrawerFooter>
            <Button variant="ghost" mr={3} onClick={() => {
              resetForm();
              onClose();
            }}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        isOpen={confirmDisclosure.isOpen}
        leastDestructiveRef={cancelRef as unknown as RefObject<FocusableElement>}
        onClose={cancelDelete}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete game
            </AlertDialogHeader>
            <AlertDialogBody>
              Removing this game will also delete all recorded events for it. Continue?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={cancelDelete}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};











