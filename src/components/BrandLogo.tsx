import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  markClassName?: string;
  lockupClassName?: string;
};

export function BrandLogo({
  compact = false,
  className,
  markClassName,
  lockupClassName,
}: BrandLogoProps) {
  return (
    <span className={cn("flex shrink-0 items-center gap-2", className)}>
      <span
        className={cn(
          "neon-scan flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-primary/35 bg-background/70 shadow-[0_0_28px_color-mix(in_oklch,var(--primary),transparent_70%)]",
          markClassName,
        )}
      >
        <Image
          src="/dealinfo-mark.svg"
          alt="DealInfo probability pulse mark"
          width={36}
          height={36}
          priority
          className="h-full w-full"
        />
      </span>
      {!compact && (
        <span className={cn("hidden flex-col justify-center sm:flex", lockupClassName)}>
          <span className="text-lg font-black leading-none tracking-normal">
            Deal<span className="text-primary neon-text-glow">Info</span>
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-[0.14em] text-muted-foreground">
            Prediction Signal
          </span>
        </span>
      )}
    </span>
  );
}
