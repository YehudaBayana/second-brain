"use client";

import {
  Alert,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Icon } from "./Icon";
import { NoteCard } from "./NoteCard";
import { useNoteSearch } from "../hooks/useNoteSearch";

/**
 * SearchView
 * Dedicated semantic search view for locating ideas and notes.
 * Consumes useNoteSearch() with zero props drilling.
 */
export function SearchView() {
  const {
    searchTerm,
    hasSearched,
    searchResults,
    searchError,
    isSearching,
    setSearchTerm,
    handleSearch,
  } = useNoteSearch();

  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
          Meaning, not just keywords
        </Text>
        <Title order={1}>Find that idea again</Title>
        <Text c="dimmed" maw={640}>
            Search your saved notes with a phrase or a question. Similar
            concepts can surface too.
        </Text>
      </Stack>

      {searchError ? (
        <Alert color="red" variant="light" role="alert">
          {searchError}
        </Alert>
      ) : null}

      <Paper component="form" onSubmit={handleSearch}>
        <Group align="flex-end">
          <TextInput
            flex={1}
            leftSection={<Icon name="search" size={18} />}
            aria-label="Search your notes"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            placeholder="e.g. How do queues make slow work reliable?"
          />
          <Button
            type="submit"
            disabled={isSearching || !searchTerm.trim()}
            loading={isSearching}
          >
            {isSearching ? "Searching…" : "Search"}
          </Button>
        </Group>
      </Paper>

      {hasSearched ? (
        <Stack gap="md">
          <Stack gap={4}>
            <Text size="xs" fw={700} tt="uppercase" c="indigo.7">
              Your results
            </Text>
            <Title order={2}>
                {searchResults.length
                  ? `${searchResults.length} related note${
                      searchResults.length === 1 ? "" : "s"
                    }`
                  : "No notes found yet"}
            </Title>
          </Stack>
          {searchResults.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {searchResults.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </SimpleGrid>
          ) : (
            <Paper>
              <Text c="dimmed">
                Try another phrase, or save a note about this topic first.
              </Text>
            </Paper>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
}

export default SearchView;
