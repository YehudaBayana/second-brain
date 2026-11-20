import { Badge, Box, NavLink } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import Link from "next/link";
import { Icon, IconName } from "../Icon";

interface SubNavItem {
  href: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badgeKey?: "dueToday";
  children?: SubNavItem[];
}

interface NavMenuItemProps {
  item: NavItem;
  pathname: string;
  dueToday: number;
}

export default function NavMenuItem({
  item,
  pathname,
  dueToday,
}: NavMenuItemProps) {
  const { hovered, ref } = useHover();
  const hasChildren = Boolean(item.children?.length);

  const isParentActive =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  const isOpened = hovered || (hasChildren && isParentActive);

  const badge =
    item.badgeKey === "dueToday" && dueToday > 0 ? (
      <Badge size="sm" variant="light" color="indigo">
        {dueToday}
      </Badge>
    ) : null;

  if (!hasChildren) {
    return (
      <NavLink
        component={Link}
        href={item.href}
        label={item.label}
        leftSection={<Icon name={item.icon} size={18} />}
        rightSection={badge}
        active={isParentActive}
        variant="light"
        color="indigo"
        aria-current={isParentActive ? "page" : undefined}
      />
    );
  }

  return (
    <Box ref={ref}>
      <NavLink
        component={Link}
        href={item.href}
        label={item.label}
        leftSection={<Icon name={item.icon} size={18} />}
        rightSection={badge}
        active={isParentActive}
        opened={isOpened}
        variant="light"
        color="indigo"
        childrenOffset={28}
      >
        {item.children?.map((subItem) => {
          const isSubActive = pathname === subItem.href;
          return (
            <NavLink
              key={subItem.href}
              component={Link}
              href={subItem.href}
              label={subItem.label}
              active={isSubActive}
              variant="subtle"
              color="indigo"
              aria-current={isSubActive ? "page" : undefined}
            />
          );
        })}
      </NavLink>
    </Box>
  );
}
