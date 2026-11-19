package notes

import "github.com/YehudaBayana/second-brain/server/learning/models"

const (
	maxQuestionLength = 500
	maxSourceText     = 30000
	maxSourceURL      = 2048
	maxChatMessage    = 2000
)

type flashcard = models.Flashcard
