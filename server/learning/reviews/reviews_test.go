package reviews

import "testing"

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
