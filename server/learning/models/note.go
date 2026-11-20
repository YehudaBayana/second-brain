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
	Explanation  string    `json:"explanation"`
	KeyTakeaways []string  `json:"keyTakeaways,omitempty"`
	CodeExamples []string  `json:"codeExamples,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}
