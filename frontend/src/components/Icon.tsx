import {
  FiArrowRight,
  FiArrowUp,
  FiBook,
  FiBookOpen,
  FiCheck,
  FiClock,
  FiDatabase,
  FiHome,
  FiLayers,
  FiLogOut,
  FiPlus,
  FiRotateCcw,
  FiSearch,
  FiX,
  FiZap,
} from "react-icons/fi";
import type { IconType } from "react-icons";

const icons = {
  home: FiHome,
  library: FiBookOpen,
  cards: FiLayers,
  search: FiSearch,
  plus: FiPlus,
  arrow: FiArrowRight,
  logout: FiLogOut,
  clock: FiClock,
  database: FiDatabase,
  sparkle: FiZap,
  check: FiCheck,
  book: FiBook,
  forgot: FiRotateCcw,
  up: FiArrowUp,
  easy: FiZap,
  close: FiX,
} satisfies Record<string, IconType>;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  const IconComponent = icons[name];
  return <IconComponent aria-hidden="true" size={size} />;
}
