import { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import {
  Button,
  Center,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { AppShell } from "./components/AppShell";
import { useEventStore } from "./store/useEventStore";
import { useAuth } from "./auth/AuthProvider";
import { msalConfigurationStatus } from "./auth/msalInstance";

function App() {
  const {
    account,
    isReady: authReady,
    isAuthenticating,
    error: authError,
    login,
    logout,
  } = useAuth();
  const initialize = useEventStore((state) => state.initialize);
  const clearError = useEventStore((state) => state.clearError);
  const hasLoaded = useEventStore((state) => state.hasLoaded);
  const isLoading = useEventStore((state) => state.isLoading);
  const isSaving = useEventStore((state) => state.isSaving);
  const error = useEventStore((state) => state.error);
  const toast = useToast();

  useEffect(() => {
    if (authReady && account) {
      void initialize();
    }
  }, [account, authReady, initialize]);

  useEffect(() => {
    if (error && hasLoaded) {
      toast({
        title: "Sync issue",
        description: error,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
      clearError();
    }
  }, [clearError, error, hasLoaded, toast]);

  if (!authReady || (isAuthenticating && !account)) {
    return (
      <Center minH="100vh">
        <Spinner color="brand.400" size="lg" />
      </Center>
    );
  }

  if (!account) {
    return (
      <Center minH="100vh" px={4}>
        <VStack spacing={4}>
          <Text fontSize="lg" textAlign="center">
            Sign in with your organization account to access Ice Insights.
          </Text>
          {authError ? (
            <Text color="red.300" textAlign="center">
              {authError}
            </Text>
          ) : null}
          {msalConfigurationStatus.isConfigured ? (
            <Button
              colorScheme="brand"
              size="lg"
              onClick={() => void login()}
              isLoading={isAuthenticating}
            >
              Sign in
            </Button>
          ) : null}
        </VStack>
      </Center>
    );
  }

  if (!hasLoaded && error && !isLoading) {
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

  if (!hasLoaded || isLoading) {
    return (
      <Center minH="100vh">
        <Spinner color="brand.400" size="lg" />
      </Center>
    );
  }

  return (
    <AppShell
      userName={account.name}
      onSignOut={() => {
        void logout();
      }}
      isSigningOut={isAuthenticating && !!account}
    >
      <Suspense
        fallback={
          <Center py={16}>
            <Spinner color="brand.400" size="lg" />
          </Center>
        }
      >
        <Outlet />
      </Suspense>
      {isSaving ? (
        <Center py={4}>
          <Text fontSize="sm" color="gray.400">
            Saving changes to Excel…
          </Text>
        </Center>
      ) : null}
    </AppShell>
  );
}

export default App;
