/**
 * OrderSuccessAnimation
 * Premium, original success confirmation animation for CUSTOMZ PARADISE BD.
 * Pure CSS/SVG (no libraries) so it never delays order confirmation.
 * Honors prefers-reduced-motion: renders the final resolved state statically.
 */
export function OrderSuccessAnimation({ className = "" }: { className?: string }) {
  return (
    <div
      className={`czp-success mx-auto ${className}`}
      role="img"
      aria-label="Order confirmed"
    >
      <style>{`
        .czp-success{position:relative;width:132px;height:132px;display:grid;place-items:center}
        @media (min-width:640px){.czp-success{width:156px;height:156px}}
        .czp-success__pulse{position:absolute;inset:0;border-radius:9999px;border:1px solid color-mix(in oklab, var(--primary) 45%, transparent);opacity:0;animation:czp-pulse 2.6s cubic-bezier(.16,.84,.44,1) infinite}
        .czp-success__pulse:nth-of-type(2){animation-delay:.9s}
        .czp-success__glow{position:absolute;inset:14%;border-radius:9999px;background:radial-gradient(circle, color-mix(in oklab, var(--primary) 38%, transparent) 0%, transparent 70%);opacity:0;animation:czp-glow .9s .25s ease-out forwards}
        .czp-success__svg{position:relative;width:100%;height:100%;overflow:visible;transform:scale(.82);opacity:0;animation:czp-pop .7s cubic-bezier(.2,1.1,.3,1) forwards}
        .czp-ring{stroke-dasharray:295;stroke-dashoffset:295;animation:czp-draw .85s .1s cubic-bezier(.65,0,.35,1) forwards}
        .czp-check{stroke-dasharray:52;stroke-dashoffset:52;animation:czp-draw .45s .72s cubic-bezier(.65,0,.35,1) forwards}
        .czp-spark{transform-origin:50px 50px;opacity:0;animation:czp-spark .75s .78s cubic-bezier(.2,.8,.3,1) forwards}
        @keyframes czp-pop{0%{transform:scale(.82);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
        @keyframes czp-draw{to{stroke-dashoffset:0}}
        @keyframes czp-glow{to{opacity:1}}
        @keyframes czp-pulse{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.35);opacity:0}}
        @keyframes czp-spark{0%{opacity:0;transform:scale(.4)}40%{opacity:1}100%{opacity:0;transform:scale(1.35)}}
        @media (prefers-reduced-motion: reduce){
          .czp-success__svg,.czp-success__glow{animation:none;opacity:1;transform:none}
          .czp-ring,.czp-check{animation:none;stroke-dashoffset:0}
          .czp-success__pulse,.czp-spark{display:none}
        }
      `}</style>
      <span className="czp-success__pulse" aria-hidden="true" />
      <span className="czp-success__pulse" aria-hidden="true" />
      <span className="czp-success__glow" aria-hidden="true" />
      <svg className="czp-success__svg" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.14"
          strokeWidth="1.5"
        />
        <circle
          className="czp-ring"
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <circle cx="50" cy="50" r="36" fill="color-mix(in oklab, var(--primary) 10%, transparent)" />
        <path
          className="czp-check"
          d="M33 51.5 L45 63 L68 39"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g className="czp-spark" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round">
          <line x1="50" y1="2" x2="50" y2="-6" />
          <line x1="50" y1="98" x2="50" y2="106" />
          <line x1="2" y1="50" x2="-6" y2="50" />
          <line x1="98" y1="50" x2="106" y2="50" />
          <line x1="16" y1="16" x2="10" y2="10" />
          <line x1="84" y1="16" x2="90" y2="10" />
          <line x1="16" y1="84" x2="10" y2="90" />
          <line x1="84" y1="84" x2="90" y2="90" />
        </g>
      </svg>
    </div>
  );
}
