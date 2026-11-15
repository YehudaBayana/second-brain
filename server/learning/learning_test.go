package learning

import (
	"strings"
	"testing"
)

func TestNextMemoryLevel(t *testing.T) {
	tests := []struct {
		name    string
		current int
		grade   string
		want    int
	}{
		{name: "forgot resets", current: 4, grade: "forgot", want: 1},
		{name: "got it advances", current: 1, grade: "got_it", want: 2},
		{name: "too easy skips a level", current: 1, grade: "too_easy", want: 3},
		{name: "got it caps at final level", current: 5, grade: "got_it", want: 5},
		{name: "too easy caps at final level", current: 4, grade: "too_easy", want: 5},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := nextMemoryLevel(test.current, test.grade); got != test.want {
				t.Fatalf("nextMemoryLevel(%d, %q) = %d, want %d", test.current, test.grade, got, test.want)
			}
		})
	}
}

func TestReviewIntervals(t *testing.T) {
	want := [...]int{1, 3, 7, 14, 30}
	if reviewIntervals != want {
		t.Fatalf("reviewIntervals = %v, want %v", reviewIntervals, want)
	}
}

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
	if _, err := vectorString(make([]float32, 1535)); err == nil {
		t.Fatal("expected an error for an embedding with the wrong dimensions")
	}

	value, err := vectorString(make([]float32, 1536))
	if err != nil {
		t.Fatalf("vectorString returned an error for a valid embedding: %v", err)
	}
	if !strings.HasPrefix(value, "[") || !strings.HasSuffix(value, "]") {
		t.Fatalf("vectorString returned malformed vector: %q", value[:min(len(value), 30)])
	}
}
