package models

import (
	"time"

	"github.com/google/uuid"
)

type Note struct {
	ID           uuid.UUID `json:"id"`
	TopicID      uuid.UUID `json:"topicId"`
	TopicName    string    `json:"topicName"`
	Title        string    `json:"title"`
	Question     string    `json:"question"`
	SourceText   string    `json:"sourceText"`
	Explanation  string    `json:"explanation"`
	KeyTakeaways []string  `json:"keyTakeaways"`
	CodeExamples []string  `json:"codeExamples"`
	SourceURL    *string   `json:"sourceUrl"`
	CreatedAt    time.Time `json:"createdAt"`
}
