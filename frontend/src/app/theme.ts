import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "indigo",
  defaultRadius: "md",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "2.25rem", lineHeight: "1.2" },
      h2: { fontSize: "1.75rem", lineHeight: "1.3" },
      h3: { fontSize: "1.25rem", lineHeight: "1.4" },
    },
  },
  components: {
    Button: {
      defaultProps: { radius: "md", size: "sm" },
    },
    Card: {
      defaultProps: {
        padding: "lg",
        radius: "md",
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: { p: "lg", radius: "md", withBorder: true },
    },
    PasswordInput: {
      defaultProps: { radius: "md", size: "sm" },
    },
    Select: {
      defaultProps: { radius: "md", size: "sm" },
    },
    Textarea: {
      defaultProps: { radius: "md", size: "sm" },
    },
    TextInput: {
      defaultProps: { radius: "md", size: "sm" },
    },
    ThemeIcon: {
      defaultProps: { radius: "md" },
    },
  },
});
