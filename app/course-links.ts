const FIRST_TOPIC_NUMBER = 1;

/**
 * Internal course data uses zero-based array indexes. Public URLs use the
 * human-facing lesson number, so lesson 01 is always `topic=1`.
 */
export function courseTopicNumber(topicIndex: number): number {
  return Math.max(0, Math.trunc(topicIndex)) + FIRST_TOPIC_NUMBER;
}

export function courseTopicIndex(
  rawTopicNumber: string | null,
  topicCount: number,
): number | null {
  if (rawTopicNumber === null || rawTopicNumber.trim() === "") return null;

  const topicNumber = Number(rawTopicNumber);
  if (!Number.isInteger(topicNumber)) return null;

  // `topic=0` existed in early links. Keep it opening lesson 01, then the
  // caller replaces it with the canonical one-based URL.
  const requestedIndex = topicNumber <= 0 ? 0 : topicNumber - FIRST_TOPIC_NUMBER;
  return Math.max(0, Math.min(Math.max(0, topicCount - 1), requestedIndex));
}

export function buildCourseUrl(
  language: string,
  topicIndex: number,
  hash: "learn" | "lab" | "notes" = "learn",
): string {
  return `/home?lang=${encodeURIComponent(language)}&topic=${courseTopicNumber(topicIndex)}#${hash}`;
}
