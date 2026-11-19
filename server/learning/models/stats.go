package models

type Stats struct {
	Notes      int `json:"notes"`
	Cards      int `json:"cards"`
	DueToday   int `json:"dueToday"`
	TopicCount int `json:"topics"`
}
