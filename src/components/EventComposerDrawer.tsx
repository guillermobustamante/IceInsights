import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  HStack,
  NumberInput,
  NumberInputField,
  Select,
  Stack,
  Tag,
  TagLabel,
  Text,
  Textarea,
  Wrap,
  WrapItem,
  useToast,
} from "@chakra-ui/react";
import { useEventStore } from "../store/useEventStore";
import type {
  EventType,
  GameEvent,
  GoalAgainstSeverity,
  GoalStrength,
} from "../types";

const strengthOptions: GoalStrength[] = ["EVEN", "PP", "SH"];
const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: "goalFor", label: "Goal For" },
  { value: "goalAgainst", label: "Goal Against" },
  { value: "penalty", label: "Penalty" },
];

const periodPresets: { value: number; label: string }[] = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "OT" },
];

const penaltyOptions: string[] = [
  "Tripping",
  "Hooking",
  "Slashing",
  "Holding",
  "Body checking (illegal)",
  "Interference",
  "High-sticking",
  "Too many players",
  "Cross-checking",
  "Boarding",
  "Charging",
  "Elbowing",
  "Kneeing",
  "Unsportsmanlike conduct",
  "Delay of game",
  "Checking from behind",
  "Goaltender interference",
  "Holding the stick",
  "Roughing",
  "Illegal equipment",
  "Leaving penalty box illegally",
  "Fighting",
  "Gross misconduct",
  "Match penalty",
  "Abuse of officials",
  "Spearing",
  "Butt-ending",
  "Head-butting",
  "Clipping",
];

const severityOptions: GoalAgainstSeverity[] = ["Minor", "Major", "Misconduct"];

interface EventComposerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event?: GameEvent | null;
}

const toggleId = (list: string[], playerId: string) =>
  list.includes(playerId)
    ? list.filter((id) => id !== playerId)
    : [...list, playerId];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const EventComposerDrawer = ({ isOpen, onClose, event }: EventComposerDrawerProps) => {
  const toast = useToast();
  const selectedGameId = useEventStore((state) => state.selectedGameId);
  const addEvent = useEventStore((state) => state.addEvent);
  const updateEvent = useEventStore((state) => state.updateEvent);
  const players = useEventStore((state) => state.players);

  const isEditing = Boolean(event);

  const [eventType, setEventType] = useState<EventType>("goalFor");
  const [strength, setStrength] = useState<GoalStrength>("EVEN");
  const [primaryPlayerId, setPrimaryPlayerId] = useState<string>("");
  const [assistIds, setAssistIds] = useState<string[]>([]);
  const [plusPlayerIds, setPlusPlayerIds] = useState<string[]>([]);
  const [minusPlayerIds, setMinusPlayerIds] = useState<string[]>([]);
  const [penaltyInfraction, setPenaltyInfraction] = useState<string>("");
  const [penaltySeverity, setPenaltySeverity] = useState<GoalAgainstSeverity | "">("");
  const [penaltyMinutes, setPenaltyMinutes] = useState(2);
  const [penaltyPlayerId, setPenaltyPlayerId] = useState<string>("");
  const [period, setPeriod] = useState(1);
  const [clockMinutes, setClockMinutes] = useState(20);
  const [clockSeconds, setClockSeconds] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (event) {
      setEventType(event.type);
      setStrength(event.strength);
      setPrimaryPlayerId(event.goalPlayerId ?? "");
      setAssistIds(event.assistIds ?? []);
      setPlusPlayerIds(event.plusPlayerIds ?? []);
      setMinusPlayerIds(event.minusPlayerIds ?? []);
      setPenaltyInfraction(event.penaltyInfraction ?? "");
      setPenaltySeverity(event.penaltySeverity ?? "");
      setPenaltyMinutes(event.penaltyMinutes ?? 2);
      setPenaltyPlayerId(event.penaltyPlayerId ?? "");
      setPeriod(event.period);
      const [minuteStr = "20", secondStr = "00"] = (event.clock ?? "20:00").split(":");
      const parsedMinutes = Number(minuteStr);
      const parsedSeconds = Number(secondStr);
      setClockMinutes(Number.isFinite(parsedMinutes) ? clamp(parsedMinutes, 0, 60) : 20);
      setClockSeconds(Number.isFinite(parsedSeconds) ? clamp(parsedSeconds, 0, 59) : 0);
      setNotes(event.notes ?? "");
    } else {
      const defaultPrimary = players[0]?.id ?? "";
      setEventType("goalFor");
      setStrength("EVEN");
      setPrimaryPlayerId(defaultPrimary);
      setAssistIds([]);
      setPlusPlayerIds(defaultPrimary ? [defaultPrimary] : []);
      setMinusPlayerIds([]);
      setPenaltyInfraction("");
      setPenaltySeverity("");
      setPenaltyMinutes(2);
      setPenaltyPlayerId("");
      setPeriod(1);
      setClockMinutes(20);
      setClockSeconds(0);
      setNotes("");
    }
  }, [event, isOpen, players]);

  useEffect(() => {
    if (eventType === "goalFor") {
      if (primaryPlayerId) {
        setPlusPlayerIds((current) =>
          current.includes(primaryPlayerId) ? current : [primaryPlayerId, ...current]
        );
      }
      setMinusPlayerIds([]);
    }
    if (eventType === "goalAgainst") {
      setPrimaryPlayerId("");
      setAssistIds([]);
      setPlusPlayerIds([]);
    }
    if (eventType === "penalty") {
      setPenaltyInfraction("");
      setPenaltySeverity("");
      setPenaltyMinutes(2);
      setPenaltyPlayerId("");
    }
  }, [eventType, primaryPlayerId]);

  const availableAssists = useMemo(
    () => players.filter((player) => player.id !== primaryPlayerId),
    [players, primaryPlayerId]
  );

  const handleToggleAssist = (playerId: string) => {
    setAssistIds((current) => toggleId(current, playerId));
  };

  const handleTogglePlus = (playerId: string) => {
    setPlusPlayerIds((current) => toggleId(current, playerId));
    setMinusPlayerIds((current) => current.filter((id) => id !== playerId));
  };

  const handleToggleMinus = (playerId: string) => {
    setMinusPlayerIds((current) => toggleId(current, playerId));
    setPlusPlayerIds((current) => current.filter((id) => id !== playerId));
  };

  const handleSubmit = () => {
    if (!selectedGameId && !event) {
      toast({ title: "No game selected", status: "warning" });
      return;
    }

    if (eventType === "goalFor" && !primaryPlayerId) {
      toast({ title: "Select the goal scorer", status: "warning" });
      return;
    }

    if (eventType === "goalAgainst" && minusPlayerIds.length === 0) {
      toast({ title: "Pick the skaters on the ice", status: "warning" });
      return;
    }

    if (eventType === "penalty" && !penaltyPlayerId) {
      toast({ title: "Select the penalized player", status: "warning" });
      return;
    }

    const safeMinutes = clamp(clockMinutes, 0, 60);
    const safeSeconds = clamp(clockSeconds, 0, 59);
    const clock = `${safeMinutes.toString().padStart(2, "0")}:${safeSeconds
      .toString()
      .padStart(2, "0")}`;

    const basePayload: Partial<GameEvent> = {
      period,
      clock,
      type: eventType,
      strength,
      goalPlayerId: eventType === "goalFor" ? primaryPlayerId : undefined,
      assistIds: eventType === "goalFor" ? assistIds : [],
      plusPlayerIds: eventType === "goalFor" ? plusPlayerIds : [],
      minusPlayerIds: eventType === "goalAgainst" ? minusPlayerIds : [],
      penaltyInfraction:
        eventType === "penalty" && penaltyInfraction ? penaltyInfraction : undefined,
      penaltySeverity:
        eventType === "penalty" && penaltySeverity ? penaltySeverity : undefined,
      penaltyMinutes: eventType === "penalty" ? penaltyMinutes : undefined,
      penaltyPlayerId: eventType === "penalty" ? penaltyPlayerId : undefined,
      notes: notes || undefined,
    };

    if (isEditing && event) {
      updateEvent(event.id, basePayload);
      toast({ title: "Event updated", status: "success" });
    } else {
      addEvent({
        ...basePayload,
        gameId: selectedGameId,
      } as Omit<GameEvent, "id" | "createdAt">);
      toast({ title: "Event saved", status: "success" });
    }

    onClose();
  };

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose} size="full">
      <DrawerOverlay />
      <DrawerContent borderTopRadius="2xl">
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth={1}>
          {isEditing ? "Edit Event" : "New Event"}
        </DrawerHeader>
        <DrawerBody>
          <Stack spacing={6}>
            <FormControl>
              <FormLabel>Event type</FormLabel>
              <HStack wrap="wrap" spacing={2}>
                {eventTypeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={eventType === option.value ? "solid" : "outline"}
                    colorScheme="brand"
                    onClick={() => setEventType(option.value)}
                    flex="1"
                  >
                    {option.label}
                  </Button>
                ))}
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>Strength</FormLabel>
              <HStack spacing={2}>
                {strengthOptions.map((option) => (
                  <Button
                    key={option}
                    variant={strength === option ? "solid" : "outline"}
                    colorScheme="brand"
                    onClick={() => setStrength(option)}
                    flex="1"
                  >
                    {option === "EVEN"
                      ? "Even"
                      : option === "PP"
                      ? "Power Play"
                      : "Short-handed"}
                  </Button>
                ))}
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>Period</FormLabel>
              <HStack spacing={2} wrap="wrap">
                {periodPresets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={period === preset.value ? "solid" : "outline"}
                    colorScheme="brand"
                    onClick={() => setPeriod(preset.value)}
                    flex="1"
                  >
                    {preset.label}
                  </Button>
                ))}
                <NumberInput
                  value={period}
                  min={1}
                  max={9}
                  step={1}
                  width="72px"
                  onChange={(_, value) => setPeriod(value || 1)}
                >
                  <NumberInputField textAlign="center" />
                </NumberInput>
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>Clock</FormLabel>
              <HStack spacing={4}
                align="center"
              >
                <Stack spacing={1} align="center">
                  <Text fontSize="xs" color="gray.400">
                    Minutes
                  </Text>
                  <NumberInput
                    value={clockMinutes}
                    min={0}
                    max={60}
                    step={1}
                    width="80px"
                    onChange={(_, value) => setClockMinutes(value ?? 0)}
                  >
                    <NumberInputField textAlign="center" inputMode="numeric" />
                  </NumberInput>
                </Stack>
                <Stack spacing={1} align="center">
                  <Text fontSize="xs" color="gray.400">
                    Seconds
                  </Text>
                  <NumberInput
                    value={clockSeconds}
                    min={0}
                    max={55}
                    step={5}
                    width="80px"
                    onChange={(_, value) => setClockSeconds(value ?? 0)}
                  >
                    <NumberInputField textAlign="center" inputMode="numeric" />
                  </NumberInput>
                </Stack>
              </HStack>
            </FormControl>

            {eventType === "goalFor" && (
              <>
                <FormControl>
                  <FormLabel>Scoring player</FormLabel>
                  <Select value={primaryPlayerId} onChange={(event) => setPrimaryPlayerId(event.target.value)}>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        #{player.number} {player.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Assists</FormLabel>
                  <HStack spacing={2} wrap="wrap">
                    {availableAssists.map((player) => {
                      const isSelected = assistIds.includes(player.id);
                      return (
                        <Tag
                          size="md"
                          key={player.id}
                          borderRadius="full"
                          variant={isSelected ? "solid" : "subtle"}
                          colorScheme={isSelected ? "brand" : undefined}
                          onClick={() => handleToggleAssist(player.id)}
                          cursor="pointer"
                          px={3}
                        >
                          <TagLabel>
                            #{player.number} {player.name.split(" ")[0]}
                          </TagLabel>
                        </Tag>
                      );
                    })}
                  </HStack>
                </FormControl>

                <Divider />

                <FormControl>
                  <FormLabel>Plus skaters</FormLabel>
                  {plusPlayerIds.length === 0 && (
                    <Text fontSize="sm" color="gray.400" mb={2}>
                      Tap the skaters who were on the ice for the goal.
                    </Text>
                  )}
                  <Wrap spacing={2}>
                    {players.map((player) => {
                      const isSelected = plusPlayerIds.includes(player.id);
                      return (
                        <WrapItem key={player.id}>
                          <Tag
                            size="md"
                            borderRadius="full"
                            variant={isSelected ? "solid" : "subtle"}
                            colorScheme={isSelected ? "green" : undefined}
                            onClick={() => handleTogglePlus(player.id)}
                            cursor="pointer"
                            px={3}
                          >
                            <TagLabel>
                              #{player.number} {player.name.split(" ")[0]}
                            </TagLabel>
                          </Tag>
                        </WrapItem>
                      );
                    })}
                  </Wrap>
                </FormControl>
              </>
            )}

            {eventType === "goalAgainst" && (
              <FormControl>
                <FormLabel>Players on the ice</FormLabel>
                {minusPlayerIds.length === 0 && (
                  <Text fontSize="sm" color="gray.400" mb={2}>
                    Select the teammates who were on the ice when the goal was scored against you.
                  </Text>
                )}
                <Wrap spacing={2}>
                  {players.map((player) => {
                    const isSelected = minusPlayerIds.includes(player.id);
                    return (
                      <WrapItem key={player.id}>
                        <Tag
                          size="md"
                          borderRadius="full"
                          variant={isSelected ? "solid" : "subtle"}
                          colorScheme={isSelected ? "red" : undefined}
                          onClick={() => handleToggleMinus(player.id)}
                          cursor="pointer"
                          px={3}
                        >
                          <TagLabel>
                            #{player.number} {player.name.split(" ")[0]}
                          </TagLabel>
                        </Tag>
                      </WrapItem>
                    );
                  })}
                </Wrap>
              </FormControl>
            )}

            {eventType === "penalty" && (
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>Penalized player</FormLabel>
                  <Select
                    placeholder="Select player"
                    value={penaltyPlayerId}
                    onChange={(event) => setPenaltyPlayerId(event.target.value)}
                  >
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        #{player.number} {player.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Penalty (optional)</FormLabel>
                  <Select
                    placeholder="Select penalty"
                    value={penaltyInfraction}
                    onChange={(event) => setPenaltyInfraction(event.target.value)}
                  >
                    {penaltyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Severity</FormLabel>
                  <Select
                    placeholder="Select severity"
                    value={penaltySeverity}
                    onChange={(event) =>
                      setPenaltySeverity((event.target.value as GoalAgainstSeverity) || "")
                    }
                  >
                    {severityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Minutes</FormLabel>
                  <NumberInput
                    min={2}
                    max={10}
                    step={2}
                    value={penaltyMinutes}
                    onChange={(_, value) => setPenaltyMinutes(value || 2)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </Stack>
            )}

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional context"
                rows={3}
              />
            </FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter gap={3}>
          <Button variant="ghost" onClick={onClose} flex="1">
            Cancel
          </Button>
          <Button colorScheme="brand" onClick={handleSubmit} flex="2">
            {isEditing ? "Update Event" : "Save Event"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
