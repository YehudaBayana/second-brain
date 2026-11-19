package embedding

import (
	"fmt"
	"strconv"
	"strings"
)

func VectorString(values []float32) (string, error) {
	if len(values) != 1536 {
		return "", fmt.Errorf("expected 1536 embedding dimensions, got %d", len(values))
	}
	var result strings.Builder
	result.WriteByte('[')
	for i, value := range values {
		if i > 0 {
			result.WriteByte(',')
		}
		result.WriteString(strconv.FormatFloat(float64(value), 'f', -1, 32))
	}
	result.WriteByte(']')
	return result.String(), nil
}
