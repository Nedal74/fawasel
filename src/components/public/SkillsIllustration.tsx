/**
 * Abstract marketing-signal illustration for the Skills section.
 *
 * Pure inline SVG with CSS animations — no JS loop — so it costs nothing at
 * runtime and stops automatically under `prefers-reduced-motion`.
 */
export function SkillsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      role="img"
      aria-label="Abstract marketing signal graphic"
      className={className}
    >
      <defs>
        <linearGradient id="skill-line" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* grid */}
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`h${i}`} x1="10" y1={40 + i * 60} x2="310" y2={40 + i * 60} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`v${i}`} x1={40 + i * 60} y1="10" x2={40 + i * 60} y2="300" />
        ))}
      </g>

      {/* growth curve */}
      <path
        d="M20 260 L80 230 L140 240 L200 150 L260 110 L300 60"
        fill="none"
        stroke="url(#skill-line)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="420"
        strokeDashoffset="420"
        style={{ animation: "draw-line 2.8s cubic-bezier(0.22,1,0.36,1) 0.2s forwards" }}
      />

      {/* nodes */}
      {[
        [80, 230],
        [140, 240],
        [200, 150],
        [260, 110],
      ].map(([cx, cy], index) => (
        <g key={`${cx}-${cy}`}>
          <circle
            cx={cx}
            cy={cy}
            r="10"
            fill="none"
            stroke="var(--accent)"
            strokeOpacity="0.35"
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              animation: `node-pulse 3.4s ease-in-out ${index * 0.45}s infinite`,
            }}
          />
          <circle cx={cx} cy={cy} r="3" fill="var(--accent)" />
        </g>
      ))}

      {/* target */}
      <g transform="translate(300 60)">
        <circle r="16" fill="none" stroke="var(--accent)" strokeOpacity="0.4" />
        <circle r="6" fill="none" stroke="var(--accent)" />
        <line x1="-24" y1="0" x2="-20" y2="0" stroke="var(--accent)" />
        <line x1="20" y1="0" x2="24" y2="0" stroke="var(--accent)" />
        <line x1="0" y1="-24" x2="0" y2="-20" stroke="var(--accent)" />
        <line x1="0" y1="20" x2="0" y2="24" stroke="var(--accent)" />
      </g>

      {/* signal bars */}
      <g transform="translate(24 40)">
        {[10, 22, 16, 30, 24].map((height, index) => (
          <rect
            key={index}
            x={index * 10}
            y={30 - height}
            width="4"
            height={height}
            fill="rgba(255,255,255,0.2)"
            style={{ animation: `bar-breathe 2.6s ease-in-out ${index * 0.2}s infinite` }}
          />
        ))}
      </g>

      <style>{`
        @keyframes draw-line { to { stroke-dashoffset: 0; } }
        @keyframes node-pulse {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(1.35); opacity: 1; }
        }
        @keyframes bar-breathe {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </svg>
  );
}
