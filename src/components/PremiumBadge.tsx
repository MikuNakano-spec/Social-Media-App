import { CheckCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  isPremium: boolean;
  className?: string;
}

export default function PremiumBadge({ isPremium, className }: PremiumBadgeProps) {
  if (!isPremium) return null;

  return (
    <span
      title="Premium User"
      className={cn(
        "relative inline-block animate-bounce-once",
        className
      )}
    >
      <CheckCircleIcon
        size={18}
        className={cn(
          "text-blue-500 drop-shadow-glow transition-transform duration-300 hover:scale-110",
          "hover:text-blue-400"
        )}
      />
      <span className="absolute -inset-1 z-[-1] animate-pulse rounded-full bg-blue-500/20 blur-md"></span>
    </span>
  );
}
