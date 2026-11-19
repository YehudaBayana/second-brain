package notes

import (
	"strings"
	"testing"

	"github.com/YehudaBayana/second-brain/server/learning/embedding"
)

func TestValidSourceURL(t *testing.T) {
	tests := []struct {
		value string
		want  bool
	}{
		{value: "", want: true},
		{value: "https://youtube.com/watch?v=example", want: true},
		{value: "http://example.com/article", want: true},
		{value: "ftp://example.com/file", want: false},
		{value: "javascript:alert(1)", want: false},
		{value: "not a url", want: false},
	}

	for _, test := range tests {
		if got := validSourceURL(test.value); got != test.want {
			t.Errorf("validSourceURL(%q) = %t, want %t", test.value, got, test.want)
		}
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
