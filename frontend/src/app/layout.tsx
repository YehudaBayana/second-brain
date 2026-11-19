import type { Metadata } from "next";
import "@mantine/core/styles.css";
import QueryProvider from "../providers/QueryProvider";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { theme } from "./theme";

export const metadata: Metadata = {
  title: "Second Brain — Your personal learning space",
  description: "Save useful ideas, connect what you learn, and make it stick.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <MantineProvider theme={theme} forceColorScheme="light">
            <ModalsProvider>{children}</ModalsProvider>
          </MantineProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
