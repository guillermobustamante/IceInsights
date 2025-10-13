import {
  Button,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  useDisclosure,
} from "@chakra-ui/react";
import { FiChevronDown } from "react-icons/fi";
import { useMemo } from "react";
import { useEventStore } from "../store/useEventStore";
import { GameManagerDrawer } from "./GameManagerDrawer";

export const GameSwitcher = () => {
  const games = useEventStore((state) => state.games);
  const selectedGameId = useEventStore((state) => state.selectedGameId);
  const selectGame = useEventStore((state) => state.selectGame);
  const managerDisclosure = useDisclosure();

  const activeGame = useMemo(
    () => games.find((game) => game.id === selectedGameId),
    [games, selectedGameId]
  );

  return (
    <>
      <Menu>
        <MenuButton as={Button} variant="outline" size="sm" rightIcon={<Icon as={FiChevronDown} />}>
          {activeGame ? `vs ${activeGame.opponent}` : "Select game"}
        </MenuButton>
        <MenuList>
          {games.map((game) => (
            <MenuItem
              key={game.id}
              onClick={() => {
                if (game.id !== selectedGameId) {
                  selectGame(game.id);
                }
              }}
            >
              vs {game.opponent}
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuItem onClick={managerDisclosure.onOpen}>Manage games...</MenuItem>
        </MenuList>
      </Menu>

      <GameManagerDrawer
        isOpen={managerDisclosure.isOpen}
        onClose={managerDisclosure.onClose}
      />
    </>
  );
};

