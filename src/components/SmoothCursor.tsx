import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * SmoothCursor Component
 * Implements a premium, ultra-smooth custom cursor-following effect.
 * Only active on desktop devices (non-touch, width > 1024px).
 */
export function SmoothCursor() {
  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const currentRef = useRef({ x: -100, y: -100 });

  const Y_OFFSET = 20;
  const LERP_FACTOR = 0.15;

  useEffect(() => {
    // Check if the device supports hover (primary input) and is large enough
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    
    const checkDisplay = () => {
      setShouldShow(mediaQuery.matches);
    };

    checkDisplay();
    setMounted(true);

    if (!mediaQuery.matches) return;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    mediaQuery.addEventListener("change", checkDisplay);

    let rafId: number;
    const animate = () => {
      if (ringRef.current) {
        const targetX = mouseRef.current.x;
        const targetY = mouseRef.current.y + Y_OFFSET;

        currentRef.current.x += (targetX - currentRef.current.x) * LERP_FACTOR;
        currentRef.current.y += (targetY - currentRef.current.y) * LERP_FACTOR;

        ringRef.current.style.transform = `translate3d(${currentRef.current.x}px, ${currentRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      mediaQuery.removeEventListener("change", checkDisplay);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!mounted || !shouldShow) return null;

  return createPortal(
    <div
      ref={ringRef}
      className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
      style={{
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        border: "1.8px solid #06B6D4",
        backgroundColor: "transparent",
        boxShadow: "0 0 14px rgba(6, 182, 212, 0.30)",
        transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)",
      }}
      data-testid="smooth-cursor"
    />,
    document.body,
  );
}
