export interface TablePreview {
  tableName: string;
  columns: string[];
  rows: Record<string, unknown>[];
}
