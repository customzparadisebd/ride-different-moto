import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * SmoothCursor Component
 * Implements a premium, ultra-smooth custom cursor-following effect.
 * Features:
 * - Normal browser pointer remains visible
 * - One small Cyan Blue circular ring smoothly follows the pointer with inertia
 * - requestAnimationFrame for 60fps performance
 * - lerp (linear interpolation) for smooth movement
 * - pointer-events: none to avoid interfering with clicks
 * - Theme-aware styling (Cyan Blue looks good in both dark and light)
 */
export function SmoothCursor() {
  const [mounted, setMounted] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  
  // Target position (mouse/pointer coordinates)
  const mouseRef = useRef({ x: 0, y: 0 });
  // Current position of the ring (interpolated)
  const currentRef = useRef({ x: 0, y: 0 });
  // Offset to position circle below the pointer
  const Y_OFFSET = 20;
  // Interpolation factor (0.10 to 0.20 for natural movement)
  const LERP_FACTOR = 0.15;

  useEffect(() => {
    setMounted(true);
    
    // Check if device supports pointer (mouse/stylus/trackpad)
    // We only show the effect if there's a pointer device or movement
    const handlePointerMove = (e: PointerEvent) => {
      // Update target coordinates
      mouseRef.set({ x: e.clientX, y: e.clientY });
    };

    // We use a setter to avoid direct mutation in the closure if preferred, 
    // but ref mutation is fine for high-frequency events.
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let rafId: number;
    const animate = () => {
      if (ringRef.current) {
        // Linear interpolation: current + (target - current) * factor
        const targetX = mouseRef.current.x;
        const targetY = mouseRef.current.y + Y_OFFSET;

        currentRef.current.x += (targetX - currentRef.current.x) * LERP_FACTOR;
        currentRef.current.y += (targetY - currentRef.current.y) * LERP_FACTOR;

        // Use translate3d for GPU acceleration
        ringRef.current.style.transform = `translate3d(${currentRef.current.x}px, ${currentRef.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!mounted) return null;

  // Render into body to ensure it's on top of everything
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
        // Initial position off-screen
        transform: "translate3d(-100px, -100px, 0)",
      }}
    />,
    document.body
  );
}
