import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import { AppShell } from "./components/AppShell";

function App() {
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
