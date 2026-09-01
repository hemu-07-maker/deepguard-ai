'use client';

export default function WireframeSphere({ size = 280 }) {
  return (
    <div className="sphere-wrap" style={{ width: size, height: size }}>
      <div className="sphere" style={{ width: size, height: size }}>
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ff3b5c" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="100" rx="90" ry="90" fill="none" stroke="url(#g1)" strokeWidth="0.8" opacity="0.5" />
          <ellipse cx="100" cy="100" rx="90" ry="35" fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.4" />
          <ellipse cx="100" cy="100" rx="35" ry="90" fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.4" />
          {[0.25, 0.5, 0.75].map((t, i) => (
            <ellipse
              key={`lat-${i}`}
              cx="100"
              cy={100 - 90 * Math.cos(t * Math.PI)}
              rx={90 * Math.sin(t * Math.PI)}
              ry={18 * Math.sin(t * Math.PI)}
              fill="none"
              stroke="#00e5ff"
              strokeWidth="0.5"
              opacity="0.45"
            />
          ))}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x1 = 100 + 90 * Math.cos(a);
            const y1 = 100 + 90 * Math.sin(a) * 0.35;
            const x2 = 100 - 90 * Math.cos(a);
            const y2 = 100 - 90 * Math.sin(a) * 0.35;
            return (
              <path
                key={`lon-${i}`}
                d={`M ${x1} ${y1} Q 100 10 ${x2} ${y2} Q 100 190 ${x1} ${y1}`}
                fill="none"
                stroke={i % 3 === 0 ? '#ff3b5c' : '#00e5ff'}
                strokeWidth="0.55"
                opacity="0.55"
              />
            );
          })}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r = 55 + (i % 3) * 12;
            return (
              <circle
                key={`p-${i}`}
                cx={100 + r * Math.cos(a)}
                cy={100 + r * Math.sin(a) * 0.7}
                r="1.2"
                fill={i % 4 === 0 ? '#ff3b5c' : '#00e5ff'}
                opacity="0.8"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
