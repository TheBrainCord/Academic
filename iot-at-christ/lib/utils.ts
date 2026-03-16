import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn/ui utility — merges Tailwind classes without conflicts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Grade → XP mapping from project spec
export function gradeToXP(grade: string): number {
  const map: Record<string, number> = {
    'A+': 200, 'A': 170, 'A-': 150,
    'B+': 120, 'B': 100, 'B-': 80,
    'C+': 60,  'C': 40,
  }
  return map[grade] ?? 0
}

// Display dates in IST (Asia/Kolkata) — sessions are stored in UTC
export function toIST(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}
