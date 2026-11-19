import { useState, type ReactNode, type MouseEvent } from "react";
import { Menu, type MantineColor } from "@mantine/core";

export type ContextMenuItem =
  | {
      divider: true;
    }
  | {
      divider?: false;
      label: string;
      icon?: ReactNode;
      color?: MantineColor;
      disabled?: boolean;
      onClick: () => void;
    };

interface ContextMenuWrapperProps {
  items: ContextMenuItem[];
  children: ReactNode;
  width?: number;
}

export function ContextMenuWrapper({
  items,
  children,
  width = 200,
}: ContextMenuWrapperProps) {
  const [opened, setOpened] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setCoords({ x: event.clientX, y: event.clientY });
    setOpened(true);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu} style={{ display: "contents" }}>
        {children}
      </div>

      <Menu
        opened={opened}
        onChange={setOpened}
        position="bottom-start"
        withinPortal
        shadow="md"
        width={width}
      >
        <Menu.Target>
          <div
            style={{
              position: "fixed",
              top: coords.y,
              left: coords.x,
              width: 1,
              height: 1,
              pointerEvents: "none",
            }}
          />
        </Menu.Target>

        <Menu.Dropdown>
          {items.map((item, index) => {
            if (item.divider) {
              return <Menu.Divider key={`divider-${index}`} />;
            }

            return (
              <Menu.Item
                key={item.label}
                leftSection={item.icon}
                color={item.color}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpened(false);
                }}
              >
                {item.label}
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
