"use client";

import { Box, Button, Text, TextInput, Title } from "@mantine/core";
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
    <Box className="search-view">
      <Box className="page-heading">
        <Box>
          <Text className="eyebrow">MEANING, NOT JUST KEYWORDS</Text>
          <Title>Find that idea again</Title>
          <Text>
            Search your saved notes with a phrase or a question. Similar
            concepts can surface too.
          </Text>
        </Box>
      </Box>

      {searchError ? (
        <Box className="error-banner" role="alert" mb="md">
          <Text>{searchError}</Text>
        </Box>
      ) : null}

      <Box component="form" className="search-form" onSubmit={handleSearch}>
        <Icon name="search" size={20} />
        <TextInput
          aria-label="Search your notes"
          classNames={{ root: "search-field" }}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          placeholder="e.g. How do queues make slow work reliable?"
        />
        <Button
          className="button button-primary"
          type="submit"
          disabled={isSearching || !searchTerm.trim()}
          loading={isSearching}
        >
          {isSearching ? "Searching…" : "Search"}
        </Button>
      </Box>

      {hasSearched ? (
        <Box className="search-results">
          <Box className="section-title-row">
            <Box>
              <Text className="eyebrow">YOUR RESULTS</Text>
              <Title order={2}>
                {searchResults.length
                  ? `${searchResults.length} related note${
                      searchResults.length === 1 ? "" : "s"
                    }`
                  : "No notes found yet"}
              </Title>
            </Box>
          </Box>
          {searchResults.length > 0 ? (
            <Box className="notes-grid">
              {searchResults.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </Box>
          ) : (
            <Text className="muted">
              Try another phrase, or save a note about this topic first.
            </Text>
          )}
        </Box>
      ) : null}
    </Box>
  );
}

export default SearchView;
