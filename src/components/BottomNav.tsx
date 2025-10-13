import { Flex, Icon, Text } from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import { FiActivity, FiUsers, FiBarChart2 } from "react-icons/fi";

const navItems = [
  { to: "/", label: "Live", icon: FiActivity },
  { to: "/roster", label: "Roster", icon: FiUsers },
  { to: "/summary", label: "Season", icon: FiBarChart2 },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <Flex
      as="nav"
      position="sticky"
      bottom={0}
      left={0}
      right={0}
      bg="gray.900"
      borderTopWidth={1}
      borderColor="gray.700"
      px={4}
      py={2}
      justify="space-between"
      zIndex={10}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <NavLink key={item.label} to={item.to} style={{ flex: 1 }}>
            <Flex
              direction="column"
              align="center"
              gap={1}
              py={1}
              borderRadius="md"
              bg={isActive ? "brand.500" : "transparent"}
              color={isActive ? "white" : "gray.300"}
              transition="background 0.2s"
            >
              <Icon as={item.icon} boxSize={5} />
              <Text fontSize="xs" fontWeight={isActive ? "bold" : "medium"}>
                {item.label}
              </Text>
            </Flex>
          </NavLink>
        );
      })}
    </Flex>
  );
};
