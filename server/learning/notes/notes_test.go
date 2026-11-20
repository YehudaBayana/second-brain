package notes

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/YehudaBayana/second-brain/server/learning/embedding"
)

func TestOptionalStringJSONPreservesAbsentAndEmptyValues(t *testing.T) {
	absent, err := marshalOptionalStrings(nil)
	if err != nil {
		t.Fatalf("marshalOptionalStrings(nil) error = %v", err)
	}
	if absent != nil {
		t.Fatalf("marshalOptionalStrings(nil) = %#v, want nil for SQL NULL", absent)
	}

	empty, err := marshalOptionalStrings([]string{})
	if err != nil {
		t.Fatalf("marshalOptionalStrings(empty) error = %v", err)
	}
	if empty != "[]" {
		t.Fatalf("marshalOptionalStrings(empty) = %#v, want %q", empty, "[]")
	}

	var decoded []string
	if err := unmarshalOptionalStrings(nil, &decoded); err != nil {
		t.Fatalf("unmarshalOptionalStrings(nil) error = %v", err)
	}
	if decoded != nil {
		t.Fatalf("unmarshalOptionalStrings(nil) = %#v, want nil", decoded)
	}
	if err := unmarshalOptionalStrings([]byte("[]"), &decoded); err != nil {
		t.Fatalf("unmarshalOptionalStrings(empty) error = %v", err)
	}
	if decoded == nil || len(decoded) != 0 {
		t.Fatalf("unmarshalOptionalStrings(empty) = %#v, want a non-nil empty slice", decoded)
	}
}

func TestGeneratedLessonOmitsOptionalSections(t *testing.T) {
	encoded, err := json.Marshal(generatedLesson{
		Title:       "Lesson",
		Explanation: "Explanation",
		Flashcards:  []aiCard{{Front: "Q", Back: "A"}},
	})
	if err != nil {
		t.Fatalf("json.Marshal(generatedLesson) error = %v", err)
	}
	if strings.Contains(string(encoded), `"key_takeaways"`) ||
		strings.Contains(string(encoded), `"code_examples"`) {
		t.Fatalf("generated lesson JSON contains absent optional sections: %s", encoded)
	}
}

func TestVectorStringRequiresExpectedDimensions(t *testing.T) {
	if _, err := embedding.VectorString(make([]float32, 1535)); err == nil {
		t.Fatal("expected an error for an embedding with the wrong dimensions")
	}

	value, err := embedding.VectorString(make([]float32, 1536))
	if err != nil {
		t.Fatalf("VectorString returned an error for a valid embedding: %v", err)
	}
	if !strings.HasPrefix(value, "[") || !strings.HasSuffix(value, "]") {
		t.Fatalf("VectorString returned malformed vector: %q", value[:min(len(value), 30)])
	}
}
