import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m";

  return "Just now";
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function generateAvatarColor(name: string): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
    'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500'
  ];
  const index = name.length % colors.length;
  return colors[index];
}