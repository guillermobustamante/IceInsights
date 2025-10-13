import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App";
import theme from "./theme";
import { Dashboard } from "./pages/Dashboard";
import { Roster } from "./pages/Roster";
import { Summary } from "./pages/Summary";

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
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>
);
