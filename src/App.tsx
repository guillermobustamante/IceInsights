import { Outlet } from "react-router-dom";
import { AppShell } from "./components/AppShell";

function App() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default App;
