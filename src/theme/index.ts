import { extendTheme } from "@chakra-ui/react";
import type { ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: "#e3f2ff",
    100: "#b9dcff",
    200: "#8fc5ff",
    300: "#64adff",
    400: "#3a96ff",
    500: "#207ce6",
    600: "#145fb4",
    700: "#0a4382",
    800: "#022851",
    900: "#000f21",
  },
};

const theme = extendTheme({
  config,
  colors,
  fonts: {
    heading: "'Poppins', system-ui, sans-serif",
    body: "'Poppins', system-ui, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "gray.900",
        color: "gray.100",
      },
    },
  },
});

export default theme;
