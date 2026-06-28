/** Extrait un message lisible d'une erreur DRF ({detail} ou {champ: [msgs]}). */
export function extractApiError(data: unknown): string {
  if (!data) return "Une erreur est survenue."
  if (typeof data === "string") return data
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>
    if (typeof obj.detail === "string") return obj.detail
    const messages = Object.values(obj).map((v) =>
      Array.isArray(v) ? v.join(" ") : String(v)
    )
    return messages.join(" ").trim() || "Une erreur est survenue."
  }
  return "Une erreur est survenue."
}
