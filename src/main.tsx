import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import theme from "./theme";

const Dashboard = lazy(async () => {
  const module = await import("./pages/Dashboard");
  return { default: module.Dashboard };
});

const Roster = lazy(async () => {
  const module = await import("./pages/Roster");
  return { default: module.Roster };
});

const Summary = lazy(async () => {
  const module = await import("./pages/Summary");
  return { default: module.Summary };
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "roster", element: <Roster /> },
      { path: "summary", element: <Summary /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <RouterProvider router={router} />
      </ChakraProvider>
    </AuthProvider>
  </React.StrictMode>
);
