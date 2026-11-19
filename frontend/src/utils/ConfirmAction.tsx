import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
}

export function openConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  confirmColor = "red",
  onConfirm,
}: ConfirmOptions) {
  modals.openConfirmModal({
    title,
    centered: true,
    children: <Text size="sm">{message}</Text>,
    labels: { confirm: confirmLabel, cancel: "Cancel" },
    confirmProps: { color: confirmColor },
    onConfirm,
  });
}
