import { useRef, useState } from "react";
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
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  SimpleGrid,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useEventStore } from "../store/useEventStore";
import type { Player } from "../types";

export const Roster = () => {
  const players = useEventStore((state) => state.players);
  const addPlayer = useEventStore((state) => state.addPlayer);
  const updatePlayer = useEventStore((state) => state.updatePlayer);
  const deletePlayer = useEventStore((state) => state.deletePlayer);

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const deleteDisclosure = useDisclosure();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [pendingDelete, setPendingDelete] = useState<Player | null>(null);

  const resetForm = () => {
    setName("");
    setNumber("");
    setPosition("");
    setEditingPlayer(null);
  };

  const handleSubmit = () => {
    if (!name || !number) {
      toast({ title: "Name and number required", status: "warning" });
      return;
    }

    if (editingPlayer) {
      updatePlayer(editingPlayer.id, {
        name,
        number: Number(number),
        position: position || undefined,
      });
      toast({ title: "Player updated", status: "success" });
    } else {
      addPlayer({
        name,
        number: Number(number),
        position: position || undefined,
      });
      toast({ title: "Player added", status: "success" });
    }

    resetForm();
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setName(player.name);
    setNumber(String(player.number));
    setPosition(player.position ?? "");
  };

  const requestDelete = (player: Player) => {
    setPendingDelete(player);
    deleteDisclosure.onOpen();
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      deletePlayer(pendingDelete.id);
      toast({ title: "Player removed", status: "info" });
    }
    setPendingDelete(null);
    deleteDisclosure.onClose();
    if (editingPlayer && pendingDelete && editingPlayer.id === pendingDelete.id) {
      resetForm();
    }
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    deleteDisclosure.onClose();
  };

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md" mb={2}>
          Roster
        </Heading>
        <Text color="gray.400" fontSize="sm">
          Manage your bench before puck drop. Add new players or update existing details and they will be available in the live event composer immediately.
        </Text>
      </Box>

      <Stack spacing={4} bg="gray.800" p={4} borderRadius="lg">
        <Heading size="sm">{editingPlayer ? "Edit player" : "Add player"}</Heading>
        <FormControl isRequired>
          <FormLabel>Name</FormLabel>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Mercer" />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Number</FormLabel>
          <Input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="9" type="number" />
        </FormControl>
        <FormControl>
          <FormLabel>Position</FormLabel>
          <Input value={position} onChange={(event) => setPosition(event.target.value)} placeholder="C" />
        </FormControl>
        <Stack direction="row" spacing={3}>
          <Button colorScheme="brand" onClick={handleSubmit} isDisabled={!name || !number}>
            {editingPlayer ? "Save changes" : "Add to roster"}
          </Button>
          {editingPlayer && (
            <Button variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </Stack>
      </Stack>

      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
        {players.map((player) => (
          <Box key={player.id} bg="gray.800" borderRadius="lg" p={4}>
            <Flex justify="space-between" align="flex-start" mb={2}>
              <Box>
                <Heading size="sm">
                  #{player.number} {player.name}
                </Heading>
                <Text fontSize="sm" color="gray.400">
                  {player.position ?? "Skater"}
                </Text>
              </Box>
              <Stack direction="row" spacing={1}>
                <IconButton
                  aria-label="Edit player"
                  icon={<FiEdit2 />}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(player)}
                />
                <IconButton
                  aria-label="Remove player"
                  icon={<FiTrash2 />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => requestDelete(player)}
                />
              </Stack>
            </Flex>
          </Box>
        ))}
      </SimpleGrid>

      <AlertDialog
        isOpen={deleteDisclosure.isOpen}
        leastDestructiveRef={cancelRef as unknown as RefObject<FocusableElement>}
        onClose={cancelDelete}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove player
            </AlertDialogHeader>
            <AlertDialogBody>
              Removing a player also clears them from any recorded events. Continue?
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
    </Stack>
  );
};









