// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getBandColor = (band: string | null) => {
  switch (band) {
    case 'A':
      return 'text-success bg-success-light border-success/20';
    case 'B':
      return 'text-info bg-info-light border-info/20';
    case 'C':
      return 'text-warning bg-warning-light border-warning/20';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
};

export const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-success';
  if (score >= 70) return 'text-info';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
};