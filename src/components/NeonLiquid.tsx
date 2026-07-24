"use client";

import type { CSSProperties, ReactNode } from "react";
import { Liquid, type LiquidOptions } from "@/components/canvasui/Liquid";
import { cn } from "@/lib/utils";
import { getLiquidColor, type ProbabilityTone } from "@/lib/market-display";

type LiquidStrength = "ambient" | "loud" | "terminal";

const OPTIONS: Record<LiquidStrength, Omit<LiquidOptions, "color">> = {
  ambient: {
    simResolution: 96,
    dyeResolution: 384,
    densityDissipation: 0.95,
    velocityDissipation: 0.98,
    pressureIterations: 3,
    curl: 1.6,
    radius: 0.32,
    force: 0.85,
    intensity: 1.9,
    distortion: 0.32,
    blend: 7,
  },
  loud: {
    simResolution: 128,
    dyeResolution: 512,
    densityDissipation: 0.965,
    velocityDissipation: 0.99,
    pressureIterations: 4,
    curl: 2.2,
    radius: 0.42,
    force: 1.25,
    intensity: 2.8,
    distortion: 0.5,
    blend: 12,
  },
  terminal: {
    simResolution: 128,
    dyeResolution: 640,
    densityDissipation: 0.972,
    velocityDissipation: 1,
    pressureIterations: 4,
    curl: 2.8,
    radius: 0.5,
    force: 1.45,
    intensity: 3.4,
    distortion: 0.62,
    blend: 16,
  },
};

interface NeonLiquidProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  tone?: ProbabilityTone;
  strength?: LiquidStrength;
  rainbow?: boolean;
}

export function NeonLiquid({
  children,
  className,
  contentClassName,
  style,
  tone = "neutral",
  strength = "loud",
  rainbow = false,
}: NeonLiquidProps) {
  const color = getLiquidColor(tone);

  return (
    <Liquid
      {...OPTIONS[strength]}
      captureContent={false}
      color={color}
      rainbow={rainbow}
      className={cn("neon-liquid group/neon relative isolate overflow-hidden", className)}
      style={style}
    >
      <div className={cn("relative z-10 h-full", contentClassName)}>{children}</div>
    </Liquid>
  );
}

export function NeonSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("neon-surface relative isolate overflow-hidden", className)}>{children}</div>;
}
