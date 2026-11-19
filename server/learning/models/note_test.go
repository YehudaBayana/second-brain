package models

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestNoteOmitsAbsentOptionalSections(t *testing.T) {
	encoded, err := json.Marshal(Note{})
	if err != nil {
		t.Fatalf("json.Marshal(Note) error = %v", err)
	}
	if strings.Contains(string(encoded), `"keyTakeaways"`) ||
		strings.Contains(string(encoded), `"codeExamples"`) {
		t.Fatalf("note JSON contains absent optional sections: %s", encoded)
	}
}
