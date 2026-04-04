export function formatMessage(message: string): string {
  if (!message) return "";

  // Convert to Title Case
  const titleCase = message
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Ensure full stop
  return titleCase.endsWith(".") ? titleCase : `${titleCase}.`;
}
