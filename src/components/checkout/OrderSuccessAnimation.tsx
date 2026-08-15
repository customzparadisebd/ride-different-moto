/**
 * OrderSuccessAnimation
 * Premium, ultra-smooth success confirmation animation for CUSTOMZ PARADISE BD.
 * Inspired by modern minimal motion design: smooth curves, particle bursts, and organic easing.
 * Pure CSS/SVG for maximum performance and instant feedback.
 */
export function OrderSuccessAnimation({ className = "" }: { className?: string }) {
  return (
    <div
      className={`czp-success-v2 mx-auto ${className}`}
      role="img"
      aria-label="Order confirmed"
    >
      <style>{`
        .czp-success-v2 {
          position: relative;
          width: 160px;
          height: 160px;
          display: grid;
          place-items: center;
          margin-bottom: 1.5rem;
        }

        .czp-sv2__glow {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: radial-gradient(circle, color-mix(in oklab, var(--primary) 25%, transparent) 0%, transparent 70%);
          opacity: 0;
          transform: scale(0.5);
          animation: czp-sv2-glow 1.2s cubic-bezier(.16, .84, .44, 1) forwards;
        }

        .czp-sv2__ring {
          position: absolute;
          inset: 15%;
          border-radius: 9999px;
          border: 3px solid var(--primary);
          opacity: 0;
          transform: scale(0.8);
          animation: czp-sv2-ring 0.6s cubic-bezier(.34, 1.56, .64, 1) 0.1s forwards;
        }

        .czp-sv2__svg {
          position: relative;
          width: 70%;
          height: 70%;
          overflow: visible;
        }

        .czp-sv2__check {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: czp-sv2-draw 0.5s cubic-bezier(.65, 0, .35, 1) 0.5s forwards;
        }

        .czp-sv2__particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
          opacity: 0;
          will-change: transform;
        }

        /* Burst Animation */
        .p1 { animation: czp-sv2-burst-1 0.8s cubic-bezier(.2, .8, .3, 1) 0.6s forwards; }
        .p2 { animation: czp-sv2-burst-2 0.8s cubic-bezier(.2, .8, .3, 1) 0.65s forwards; }
        .p3 { animation: czp-sv2-burst-3 0.8s cubic-bezier(.2, .8, .3, 1) 0.7s forwards; }
        .p4 { animation: czp-sv2-burst-4 0.8s cubic-bezier(.2, .8, .3, 1) 0.62s forwards; }
        .p5 { animation: czp-sv2-burst-5 0.8s cubic-bezier(.2, .8, .3, 1) 0.68s forwards; }
        .p6 { animation: czp-sv2-burst-6 0.8s cubic-bezier(.2, .8, .3, 1) 0.72s forwards; }

        @keyframes czp-sv2-glow {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.8; transform: scale(1.2); }
          100% { opacity: 0.4; transform: scale(1); }
        }

        @keyframes czp-sv2-ring {
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes czp-sv2-draw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes czp-sv2-burst-1 { 0% { opacity: 0; transform: translate(0, 0) scale(1); } 50% { opacity: 1; } 100% { opacity: 0; transform: translate(0, -50px) scale(0.5); } }
        @keyframes czp-sv2-burst-2 { 0% { opacity: 0; transform: translate(0, 0) scale(1); } 50% { opacity: 1; } 100% { opacity: 0; transform: translate(40px, -30px) scale(0.5); } }
        @keyframes czp-sv2-burst-3 { 0% { opacity: 0; transform: translate(0, 0) scale(1); } 50% { opacity: 1; } 100% { opacity: 0; transform: translate(40px, 30px) scale(0.5); } }
        @keyframes czp-sv2-burst-4 { 0% { opacity: 0; transform: translate(0, 0) scale(1); } 50% { opacity: 1; } 100% { opacity: 0; transform: translate(0, 50px) scale(0.5); } }
        @keyframes czp-sv2-burst-5 { 0% { opacity: 0; transform: translate(0, 0) scale(1); } 50% { opacity: 1; } 100% { opacity: 0; transform: translate(-40px, 30px) scale(0.5); } }
        @keyframes czp-sv2-burst-6 { 0% { opacity: 0; transform: translate(0, 0) scale(1); } 50% { opacity: 1; } 100% { opacity: 0; transform: translate(-40px, -30px) scale(0.5); } }

        @media (prefers-reduced-motion: reduce) {
          .czp-sv2__glow, .czp-sv2__ring, .czp-sv2__check {
            animation: none;
            opacity: 1;
            transform: scale(1);
            stroke-dashoffset: 0;
          }
          .czp-sv2__particle { display: none; }
        }
      `}</style>

      <div className="czp-sv2__glow" aria-hidden="true" />
      <div className="czp-sv2__ring" aria-hidden="true" />
      
      {/* Particles */}
      <div className="czp-sv2__particle p1" aria-hidden="true" />
      <div className="czp-sv2__particle p2" aria-hidden="true" />
      <div className="czp-sv2__particle p3" aria-hidden="true" />
      <div className="czp-sv2__particle p4" aria-hidden="true" />
      <div className="czp-sv2__particle p5" aria-hidden="true" />
      <div className="czp-sv2__particle p6" aria-hidden="true" />

      <svg className="czp-sv2__svg" viewBox="0 0 100 100" aria-hidden="true">
        <path
          className="czp-sv2__check"
          d="M30 50 L45 65 L75 35"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
