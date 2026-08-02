type PetSpeechBubbleProps = {
  message: string | null;
};

export function PetSpeechBubble({ message }: PetSpeechBubbleProps) {
  return (
    <div
      className={`web-pet-bubble ${message ? "is-visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
