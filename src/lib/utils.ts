import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function formatDate(date: string): string {
  const parsed = new Date(date)
  const day = String(parsed.getUTCDate()).padStart(2, "0")
  const month = MONTH_NAMES[parsed.getUTCMonth()]
  const year = parsed.getUTCFullYear()
  return `${day} ${month}, ${year}`
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.trim().slice(0, 2).toUpperCase()
}
