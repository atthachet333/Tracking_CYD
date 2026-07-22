import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

/** ตัวเลขนับขึ้น (Animated Counter) — snap ทันทีเมื่อผู้ใช้ตั้งค่า reduce motion */
export function AnimatedNumber({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>();

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return undefined;
    }
    const start = performance.now();
    const dur = 900;
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value]);

  const text = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString("en-US");
  return (
    <span className="tnum">
      {text}
      {suffix}
    </span>
  );
}
