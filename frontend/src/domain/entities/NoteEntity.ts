import type { Note } from "@/src/features/learning/model/types";

/**
 * NoteEntity
 * Rich Domain Entity representing a Study Note.
 * Encapsulates domain logic, formatting, and invariants.
 */
export class NoteEntity implements Note {
  readonly id: string;
  readonly topicId: string;
  readonly topicName: string;
  readonly title: string;
  readonly question: string;
  readonly sourceText: string;
  readonly explanation: string;
  readonly keyTakeaways: string[];
  readonly codeExamples: string[];
  readonly sourceUrl: string | null;
  readonly createdAt: string;

  constructor(data: Note) {
    this.id = data.id;
    this.topicId = data.topicId;
    this.topicName = data.topicName;
    this.title = data.title;
    this.question = data.question;
    this.sourceText = data.sourceText || "";
    this.explanation = data.explanation || "";
    this.keyTakeaways = Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [];
    this.codeExamples = Array.isArray(data.codeExamples) ? data.codeExamples : [];
    this.sourceUrl = data.sourceUrl || null;
    this.createdAt = data.createdAt;
  }

  /**
   * Title fallback to question if title is empty.
   */
  get displayTitle(): string {
    return this.title?.trim() || this.question?.trim() || "Untitled Note";
  }

  /**
   * Formatted creation date (e.g. "Oct 12, 2026").
   */
  get formattedDate(): string {
    if (!this.createdAt) return "";
    try {
      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(this.createdAt));
    } catch {
      return this.createdAt;
    }
  }

  /**
   * Returns true if a valid source URL is attached.
   */
  get hasSourceUrl(): boolean {
    return Boolean(this.sourceUrl && this.sourceUrl.trim().length > 0);
  }

  /**
   * Returns domain name from source URL if available.
   */
  get sourceDomain(): string | null {
    if (!this.hasSourceUrl || !this.sourceUrl) return null;
    try {
      return new URL(this.sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }

  /**
   * Returns true if note has code snippets.
   */
  get hasCodeExamples(): boolean {
    return this.codeExamples.length > 0;
  }

  /**
   * Returns count of key takeaways.
   */
  get takeawaysCount(): number {
    return this.keyTakeaways.length;
  }

  /**
   * Check if note content matches a keyword or query.
   */
  public matchesQuery(query: string): boolean {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      this.title.toLowerCase().includes(q) ||
      this.question.toLowerCase().includes(q) ||
      this.explanation.toLowerCase().includes(q) ||
      this.keyTakeaways.some((t) => t.toLowerCase().includes(q))
    );
  }

  public static fromRaw(data: Note): NoteEntity {
    return new NoteEntity(data);
  }

  public static fromRawList(list: Note[] = []): NoteEntity[] {
    return list.map((item) => NoteEntity.fromRaw(item));
  }
}
