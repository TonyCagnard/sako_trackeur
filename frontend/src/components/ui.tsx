import type { InputHTMLAttributes } from "react"

type TextFieldProps = {
  label: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

/** Champ texte stylé et réutilisable. */
export function TextField({ label, error, className, ...props }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 ${
          error
            ? "border-rose-400 focus:border-rose-400 focus:ring-rose-200"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
        } ${className ?? ""}`}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  )
}
