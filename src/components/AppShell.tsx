import type { ReactNode } from "react";
import {
  Box,
  Flex,
  Heading,
  IconButton,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiMoon, FiSun } from "react-icons/fi";
import { BottomNav } from "./BottomNav";
import { GameSwitcher } from "./GameSwitcher";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue("gray.50", "gray.900");
  const headerBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Flex direction="column" minH="100vh" bg={bg}>
      <Box
        as="header"
        px={4}
        py={3}
        bg={headerBg}
        borderBottomWidth={1}
        borderColor={borderColor}
      >
        <Flex align="center" justify="space-between" gap={3}>
          <Heading size="md">Ice Insights</Heading>
          <Flex align="center" gap={2}>
            <GameSwitcher />
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === "dark" ? <FiSun /> : <FiMoon />}
              onClick={toggleColorMode}
              variant="ghost"
            />
          </Flex>
        </Flex>
      </Box>

      <Box as="main" flex="1 1 auto" px={4} py={4} pb={20}>
        {children}
      </Box>

      <BottomNav />
    </Flex>
  );
};
