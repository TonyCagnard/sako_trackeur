import { Moon, Sun } from "lucide-react"
import { useTheme } from "../context/ThemeContext"

/** Bascule entre les thèmes Obsidienne (sombre) et Ivoire (clair). */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-content"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
