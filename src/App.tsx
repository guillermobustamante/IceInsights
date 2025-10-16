import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Button, Center, Spinner, Text, VStack, useToast } from "@chakra-ui/react";
import { AppShell } from "./components/AppShell";
import { useEventStore } from "./store/useEventStore";

function App() {
  const initialize = useEventStore((state) => state.initialize);
  const clearError = useEventStore((state) => state.clearError);
  const isLoading = useEventStore((state) => state.isLoading);
  const error = useEventStore((state) => state.error);
  const players = useEventStore((state) => state.players);
  const games = useEventStore((state) => state.games);
  const events = useEventStore((state) => state.events);
  const toast = useToast();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (
      error &&
      !isLoading &&
      (players.length > 0 || games.length > 0 || events.length > 0)
    ) {
      toast({
        title: "Sync issue",
        description: error,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
      clearError();
    }
  }, [clearError, error, events.length, games.length, isLoading, players.length, toast]);

  if (isLoading && players.length === 0 && games.length === 0 && events.length === 0) {
    return (
      <Center minH="100vh">
        <Spinner color="brand.400" size="lg" />
      </Center>
    );
  }

  if (
    error &&
    players.length === 0 &&
    games.length === 0 &&
    events.length === 0
  ) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Text color="red.300" textAlign="center">
            We could not load the latest data from Excel. Check your API settings and try again.
          </Text>
          <Button colorScheme="brand" onClick={() => void initialize()}>
            Retry
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <AppShell>
      <Suspense
        fallback={
          <Center py={16}>
            <Spinner color="brand.400" size="lg" />
          </Center>
        }
      >
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

export default App;
