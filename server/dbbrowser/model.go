package dbbrowser

// TablePreview holds the column order and sample rows for a single SQL table.
type TablePreview struct {
	TableName string           `json:"tableName"`
	Columns   []string         `json:"columns"`
	Rows      []map[string]any `json:"rows"`
}
