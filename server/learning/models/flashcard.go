package models

import "github.com/google/uuid"

type Flashcard struct {
	ID             uuid.UUID `json:"id"`
	NoteID         uuid.UUID `json:"noteId"`
	TopicName      string    `json:"topicName"`
	NoteTitle      string    `json:"noteTitle"`
	FrontQuestion  string    `json:"frontQuestion"`
	BackAnswer     string    `json:"backAnswer"`
	MemoryLevel    int       `json:"memoryLevel"`
	NextReviewDate string    `json:"nextReviewDate"`
}
