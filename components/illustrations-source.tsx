import React, { type ReactNode } from "react";

type IlloProps = { className?: string; label?: string };

function Frame({
  id,
  children,
  label,
  className,
  tone = "brand",
}: {
  id: string;
  children: ReactNode;
  label: string;
  className?: string;
  tone?: "brand" | "cyan" | "rose" | "emerald" | "amber";
}) {
  const accent =
    tone === "cyan"
      ? ["#C7A46A", "#A98448"]
      : tone === "rose"
        ? ["#B4553B", "#8E3B2A"]
        : tone === "emerald"
          ? ["#5E7A5A", "#4A6448"]
          : tone === "amber"
            ? ["#C7A46A", "#8F6F3E"]
            : ["#65452F", "#4E3423"];
  return (
    <svg
      viewBox="0 0 560 400"
      role="img"
      aria-label={label}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F7F1E7" />
          <stop offset="0.55" stopColor="#FFFCF6" />
          <stop offset="1" stopColor="#EFE3D0" />
        </linearGradient>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent[0]} />
          <stop offset="1" stopColor={accent[1]} />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2B1D14" stopOpacity="0.1" />
          <stop offset="1" stopColor="#2B1D14" stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.2" r="0.8">
          <stop offset="0" stopColor={accent[0]} stopOpacity="0.32" />
          <stop offset="1" stopColor={accent[0]} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-dots`} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.2" fill="#2B1D14" fillOpacity="0.08" />
        </pattern>
      </defs>
      <rect width="560" height="400" rx="28" fill={`url(#${id}-bg)`} />
      <rect width="560" height="400" rx="28" fill={`url(#${id}-dots)`} />
      <rect width="560" height="400" rx="28" fill={`url(#${id}-glow)`} />
      <rect
        x="1"
        y="1"
        width="558"
        height="398"
        rx="27"
        fill="none"
        stroke="#2B1D14"
        strokeOpacity="0.08"
      />
      <circle cx="470" cy="60" r="110" fill={accent[0]} fillOpacity="0.09" />
      <circle cx="70" cy="350" r="100" fill="#C7A46A" fillOpacity="0.05" />
      {children}
    </svg>
  );
}

function Person({
  x,
  y,
  color = "#65452F",
  scale = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  color?: string;
  scale?: number;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <circle cx="0" cy="-38" r="16" fill={color} fillOpacity="0.9" />
      <path
        d="M -24 12 C -24 -12, -14 -20, 0 -20 C 14 -20, 24 -12, 24 12 Z"
        fill={color}
        fillOpacity="0.75"
      />
    </g>
  );
}

function MiniBar({
  x,
  y,
  h,
  w = 14,
  color = "#65452F",
  opacity = 1,
}: {
  x: number;
  y: number;
  h: number;
  w?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <rect
      x={x}
      y={y - h}
      width={w}
      height={h}
      rx={4}
      fill={color}
      fillOpacity={opacity}
    />
  );
}

export function HeroQueueScene({ className, label = "A person managing a digital queue on a phone while others relax" }: IlloProps) {
  return (
    <Frame id="hero" label={label} className={className}>
      <g transform="translate(190 48)">
        <rect x="0" y="0" width="184" height="318" rx="28" fill="#FFFCF6" stroke="#2B1D14" strokeOpacity="0.14" />
        <rect x="10" y="18" width="164" height="282" rx="20" fill="#FFFCF6" />
        <rect x="68" y="8" width="48" height="6" rx="3" fill="#E4D5C1" />
        <rect x="24" y="34" width="136" height="64" rx="14" fill="url(#hero-a)" fillOpacity="0.18" stroke="#65452F" strokeOpacity="0.35" />
        <text x="38" y="58" fill="#8F6F3E" fontSize="9" fontFamily="sans-serif" letterSpacing="1.5">SUNRISE HOSPITAL</text>
        <text x="38" y="82" fill="#2B1D14" fontSize="24" fontWeight="700" fontFamily="sans-serif">S-015</text>
        <rect x="24" y="110" width="136" height="74" rx="14" fill="#2B1D14" fillOpacity="0.035" />
        <text x="38" y="130" fill="#786B60" fontSize="8" fontFamily="sans-serif">YOUR POSITION</text>
        <circle cx="78" cy="160" r="21" fill="none" stroke="#2B1D14" strokeOpacity="0.1" strokeWidth="5" />
        <circle cx="78" cy="160" r="21" fill="none" stroke="#C7A46A" strokeWidth="5" strokeDasharray="96 132" strokeLinecap="round" transform="rotate(-90 78 160)" />
        <text x="78" y="164" fill="#2B1D14" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">3rd</text>
        <text x="112" y="150" fill="#A98448" fontSize="10" fontFamily="sans-serif">2 ahead</text>
        <text x="112" y="166" fill="#2B1D14" fontSize="13" fontWeight="600" fontFamily="sans-serif">~14 min</text>
        <text x="112" y="179" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">est. turn</text>
        <rect x="24" y="196" width="136" height="34" rx="10" fill="#65452F" fillOpacity="0.16" stroke="#65452F" strokeOpacity="0.3" />
        <text x="36" y="217" fill="#8F6F3E" fontSize="9" fontFamily="sans-serif">🔔 Turn alert enabled</text>
        <rect x="24" y="240" width="136" height="34" rx="10" fill="#5E7A5A" fillOpacity="0.12" stroke="#5E7A5A" strokeOpacity="0.25" />
        <text x="36" y="261" fill="#5E7A5A" fontSize="9" fontFamily="sans-serif">Counter 2 · OPD</text>
      </g>

      <g transform="translate(48 214)">
        <rect x="0" y="42" width="126" height="78" rx="16" fill="url(#hero-glass)" stroke="#2B1D14" strokeOpacity="0.12" />
        <text x="16" y="68" fill="#786B60" fontSize="8" fontFamily="sans-serif">TIME SAVED TODAY</text>
        <text x="16" y="98" fill="#2B1D14" fontSize="25" fontWeight="700" fontFamily="sans-serif">2h 40m</text>
        <path d="M 16 108 L 40 100 L 60 104 L 84 92 L 108 96" stroke="#C7A46A" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      <g transform="translate(400 210)">
        <rect x="0" y="0" width="108" height="56" rx="14" fill="#2B1D14" fillOpacity="0.05" stroke="#2B1D14" strokeOpacity="0.1" />
        <circle cx="22" cy="28" r="10" fill="#C7A46A" fillOpacity="0.18" />
        <path d="M18 28 l3 3 l6 -7" stroke="#A98448" strokeWidth="2" fill="none" strokeLinecap="round" />
        <text x="40" y="24" fill="#2B1D14" fontSize="9" fontFamily="sans-serif">Token verified</text>
        <text x="40" y="38" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">Check-in complete</text>
      </g>

      <g transform="translate(408 292)">
        <rect x="0" y="0" width="100" height="42" rx="12" fill="#2B1D14" fillOpacity="0.04" stroke="#2B1D14" strokeOpacity="0.09" />
        <text x="14" y="18" fill="#786B60" fontSize="7" fontFamily="sans-serif">EST. WAIT</text>
        <text x="14" y="32" fill="#A98448" fontSize="14" fontWeight="700" fontFamily="sans-serif">12–18 min</text>
      </g>

      <Person x={126} y={150} color="#C7A46A" scale={0.9} />
      <Person x={392} y={148} color="#65452F" scale={0.85} />
      <Person x={446} y={172} color="#B4553B" scale={0.7} opacity={0.8} />
      <circle cx="446" cy="108" r="3" fill="#A98448" />
      <circle cx="428" cy="90" r="2" fill="#8F6F3E" fillOpacity="0.7" />
    </Frame>
  );
}

export function CrowdedWaitingRoomScene({ className, label = "A crowded waiting room with long queues and wasted time" }: IlloProps) {
  return (
    <Frame id="crowd" label={label} className={className} tone="rose">
      <g transform="translate(58 54)">
        <rect x="0" y="0" width="444" height="292" rx="20" fill="#FFFCF6" fillOpacity="0.8" stroke="#2B1D14" strokeOpacity="0.08" />
        <rect x="0" y="0" width="444" height="42" rx="20" fill="#2B1D14" fillOpacity="0.04" />
        <text x="20" y="26" fill="#C46A50" fontSize="10" fontFamily="sans-serif" letterSpacing="1.4">WAITING HALL · 47 PEOPLE</text>
        <g transform="translate(378 12)">
          <rect width="48" height="20" rx="10" fill="#8E3B2A" fillOpacity="0.18" />
          <text x="24" y="14" fill="#C46A50" fontSize="8" textAnchor="middle" fontFamily="sans-serif">1h 20m</text>
        </g>
        {[0, 1, 2].map((row) => (
          <g key={row} transform={`translate(26 ${72 + row * 66})`}>
            {[0, 1, 2, 3, 4, 5].map((col) => (
              <g key={col} transform={`translate(${col * 66} 0)`}>
                <rect x="0" y="18" width="50" height="12" rx="5" fill="#E4D5C1" />
                <Person
                  x={25}
                  y={20}
                  scale={0.55}
                  color={["#B4553B", "#65452F", "#C7A46A", "#786B60", "#B4553B", "#A98448"][(row + col) % 6]}
                  opacity={0.85}
                />
              </g>
            ))}
          </g>
        ))}
        <g transform="translate(330 56)">
          <circle cx="30" cy="30" r="30" fill="#8E3B2A" fillOpacity="0.15" stroke="#B4553B" strokeOpacity="0.4" />
          <path d="M30 13v18l11 7" stroke="#C46A50" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(360 226)">
          <rect width="66" height="52" rx="8" fill="#F7F1E7" stroke="#2B1D14" strokeOpacity="0.12" />
          <text x="33" y="20" fill="#C46A50" fontSize="7" textAnchor="middle" fontFamily="sans-serif">NOW</text>
          <text x="33" y="38" fill="#2B1D14" fontSize="14" textAnchor="middle" fontWeight="700" fontFamily="sans-serif">10:42</text>
        </g>
      </g>
      <g transform="translate(70 96) rotate(-6)">
        <rect width="118" height="38" rx="10" fill="#8E3B2A" fillOpacity="0.16" stroke="#B4553B" strokeOpacity="0.35" />
        <text x="14" y="17" fill="#F7E3DA" fontSize="8" fontFamily="sans-serif">TOKEN 42</text>
        <text x="14" y="30" fill="#786B60" fontSize="7" fontFamily="sans-serif">Still waiting…</text>
      </g>
    </Frame>
  );
}

export function SmoothServiceScene({ className, label = "An organised service experience with a neat queue and happy customers" }: IlloProps) {
  return (
    <Frame id="smooth" label={label} className={className} tone="emerald">
      <g transform="translate(64 62)">
        <rect x="0" y="0" width="432" height="270" rx="22" fill="#FFFCF6" fillOpacity="0.78" stroke="#2B1D14" strokeOpacity="0.08" />
        <rect x="22" y="24" width="186" height="222" rx="16" fill="#2B1D14" fillOpacity="0.035" stroke="#2B1D14" strokeOpacity="0.07" />
        <text x="40" y="50" fill="#5E7A5A" fontSize="9" fontFamily="sans-serif" letterSpacing="1.2">LIVE QUEUE</text>
        {[
          ["A-101", "Serving", "#5E7A5A"],
          ["A-102", "Next", "#A98448"],
          ["A-103", "Waiting", "#786B60"],
          ["A-104", "Waiting", "#786B60"],
        ].map(([token, status, color], i) => (
          <g key={token} transform={`translate(38 ${70 + i * 42})`}>
            <rect width="154" height="32" rx="9" fill="#2B1D14" fillOpacity={i === 0 ? 0.07 : 0.03} stroke="#2B1D14" strokeOpacity={i === 0 ? 0.14 : 0.06} />
            <text x="12" y="20" fill={i === 0 ? "#fff" : "#5F5147"} fontSize="11" fontWeight="600" fontFamily="sans-serif">{token}</text>
            <text x="142" y="20" fill={color} fontSize="8" textAnchor="end" fontFamily="sans-serif">{status}</text>
          </g>
        ))}
        <g transform="translate(236 24)">
          <rect width="172" height="128" rx="16" fill="#5E7A5A" fillOpacity="0.08" stroke="#5E7A5A" strokeOpacity="0.22" />
          <text x="18" y="26" fill="#786B60" fontSize="8" fontFamily="sans-serif">AVG. WAIT TODAY</text>
          <text x="18" y="62" fill="#2B1D14" fontSize="34" fontWeight="700" fontFamily="sans-serif">11m</text>
          <path d="M18 92 L46 84 L70 88 L96 72 L124 76 L150 58" stroke="#5E7A5A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="150" cy="58" r="4" fill="#5E7A5A" />
        </g>
        <g transform="translate(236 166)">
          <rect width="172" height="80" rx="16" fill="#2B1D14" fillOpacity="0.035" stroke="#2B1D14" strokeOpacity="0.07" />
          <circle cx="32" cy="40" r="16" fill="#C7A46A" fillOpacity="0.16" />
          <path d="M25 40 l5 5 l10 -11" stroke="#A98448" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <text x="58" y="34" fill="#2B1D14" fontSize="9" fontFamily="sans-serif">Service complete</text>
          <text x="58" y="50" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">Token A-100 · 9 min</text>
        </g>
      </g>
      <Person x={498} y={318} color="#5E7A5A" scale={0.8} />
      <Person x={72} y={348} color="#C7A46A" scale={0.7} />
      <circle cx="494" cy="112" r="5" fill="#5E7A5A" fillOpacity="0.5" />
      <circle cx="76" cy="76" r="3" fill="#A98448" fillOpacity="0.6" />
    </Frame>
  );
}

export function UserLoginScene({ className, label = "A customer using a phone to manage their queue securely" }: IlloProps) {
  return (
    <Frame id="userlogin" label={label} className={className}>
      <g transform="translate(214 38)">
        <rect width="132" height="250" rx="24" fill="#FFFCF6" stroke="#2B1D14" strokeOpacity="0.15" />
        <rect x="8" y="14" width="116" height="222" rx="18" fill="#FFFCF6" />
        <rect x="42" y="6" width="48" height="5" rx="2.5" fill="#E4D5C1" />
        <circle cx="66" cy="78" r="30" fill="url(#userlogin-a)" fillOpacity="0.25" stroke="#65452F" strokeOpacity="0.5" />
        <circle cx="66" cy="70" r="11" fill="#8F6F3E" />
        <path d="M46 96 c0 -14 9 -18 20 -18 c11 0 20 4 20 18" fill="#8F6F3E" fillOpacity="0.8" />
        <text x="66" y="132" fill="#2B1D14" fontSize="11" textAnchor="middle" fontWeight="600" fontFamily="sans-serif">Welcome back</text>
        <rect x="20" y="146" width="92" height="20" rx="6" fill="#2B1D14" fillOpacity="0.05" stroke="#2B1D14" strokeOpacity="0.08" />
        <rect x="20" y="172" width="92" height="20" rx="6" fill="#2B1D14" fillOpacity="0.05" stroke="#2B1D14" strokeOpacity="0.08" />
        <rect x="20" y="200" width="92" height="22" rx="7" fill="url(#userlogin-a)" />
        <text x="66" y="215" fill="#2B1D14" fontSize="8" textAnchor="middle" fontWeight="600" fontFamily="sans-serif">Sign in</text>
      </g>
      <g transform="translate(66 74)">
        <circle cx="46" cy="46" r="46" fill="#65452F" fillOpacity="0.12" stroke="#65452F" strokeOpacity="0.3" />
        <path d="M46 22 l22 9 v16 c0 16 -10 25 -22 30 c-12 -5 -22 -14 -22 -30 v-16 z" fill="#65452F" fillOpacity="0.25" stroke="#8F6F3E" strokeOpacity="0.6" />
        <path d="M36 47 l7 7 l14 -16" stroke="#8F6F3E" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <g transform="translate(366 90)">
        <rect width="128" height="68" rx="14" fill="#2B1D14" fillOpacity="0.05" stroke="#2B1D14" strokeOpacity="0.1" />
        <text x="16" y="24" fill="#786B60" fontSize="7" fontFamily="sans-serif">SECURE SESSION</text>
        <text x="16" y="40" fill="#2B1D14" fontSize="9" fontFamily="sans-serif">Email verified</text>
        <text x="16" y="54" fill="#A98448" fontSize="8" fontFamily="sans-serif">httpOnly cookie</text>
      </g>
      <g transform="translate(366 286)">
        <rect width="128" height="58" rx="14" fill="#C7A46A" fillOpacity="0.08" stroke="#C7A46A" strokeOpacity="0.2" />
        <circle cx="24" cy="29" r="10" fill="#C7A46A" fillOpacity="0.2" />
        <path d="M20 29 l3 3 l6 -7" stroke="#A98448" strokeWidth="2" fill="none" strokeLinecap="round" />
        <text x="42" y="26" fill="#2B1D14" fontSize="8" fontFamily="sans-serif">Queue synced</text>
        <text x="42" y="39" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">S-015 waiting</text>
      </g>
      <Person x={78} y={332} color="#C7A46A" scale={0.8} />
      <Person x={474} y={200} color="#65452F" scale={0.7} />
    </Frame>
  );
}

export function OrgLoginScene({ className, label = "Service staff managing customer queues from a dashboard" }: IlloProps) {
  return (
    <Frame id="orglogin" label={label} className={className} tone="cyan">
      <g transform="translate(66 52)">
        <rect width="428" height="288" rx="20" fill="#FFFCF6" fillOpacity="0.85" stroke="#2B1D14" strokeOpacity="0.1" />
        <rect width="428" height="38" rx="20" fill="#2B1D14" fillOpacity="0.04" />
        <circle cx="22" cy="19" r="4" fill="#B4553B" />
        <circle cx="36" cy="19" r="4" fill="#C7A46A" />
        <circle cx="50" cy="19" r="4" fill="#5E7A5A" />
        <text x="70" y="23" fill="#786B60" fontSize="8" fontFamily="sans-serif">SUNRISE HOSPITAL · QUEUE OPS</text>
        <rect x="20" y="56" width="232" height="208" rx="14" fill="#F7F1E7" stroke="#2B1D14" strokeOpacity="0.07" />
        <text x="36" y="78" fill="#A98448" fontSize="8" letterSpacing="1.2" fontFamily="sans-serif">NOW SERVING</text>
        <text x="36" y="118" fill="#2B1D14" fontSize="36" fontWeight="700" fontFamily="sans-serif">S-013</text>
        <text x="36" y="140" fill="#786B60" fontSize="8" fontFamily="sans-serif">Counter 2 · OPD</text>
        <rect x="36" y="156" width="200" height="1" fill="#2B1D14" fillOpacity="0.08" />
        {[
          ["S-014", "Senior priority"],
          ["S-015", "Waiting"],
          ["S-016", "Waiting"],
        ].map(([token, note], i) => (
          <g key={token} transform={`translate(36 ${168 + i * 28})`}>
            <text y="12" fill="#2B1D14" fontSize="9" fontFamily="sans-serif">{token}</text>
            <text x="200" y="12" fill={i === 0 ? "#C7A46A" : "#8A7A6C"} fontSize="7" textAnchor="end" fontFamily="sans-serif">{note}</text>
          </g>
        ))}
        <rect x="266" y="56" width="142" height="98" rx="14" fill="#C7A46A" fillOpacity="0.09" stroke="#C7A46A" strokeOpacity="0.22" />
        <text x="282" y="78" fill="#786B60" fontSize="7" fontFamily="sans-serif">TODAY'S VISITORS</text>
        <text x="282" y="108" fill="#2B1D14" fontSize="28" fontWeight="700" fontFamily="sans-serif">128</text>
        <path d="M282 132 L306 126 L328 130 L350 118 L376 122 L394 112" stroke="#C7A46A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="266" y="166" width="142" height="98" rx="14" fill="#2B1D14" fillOpacity="0.03" stroke="#2B1D14" strokeOpacity="0.07" />
        <text x="282" y="188" fill="#786B60" fontSize="7" fontFamily="sans-serif">COUNTERS ACTIVE</text>
        <text x="282" y="214" fill="#5E7A5A" fontSize="22" fontWeight="700" fontFamily="sans-serif">3 / 3</text>
        <rect x="282" y="228" width="110" height="6" rx="3" fill="#2B1D14" fillOpacity="0.07" />
        <rect x="282" y="228" width="110" height="6" rx="3" fill="#5E7A5A" fillOpacity="0.6" />
        <rect x="282" y="246" width="70" height="8" rx="4" fill="#65452F" fillOpacity="0.5" />
      </g>
      <Person x={516} y={320} color="#C7A46A" scale={0.8} />
      <Person x={62} y={360} color="#65452F" scale={0.65} />
      <g transform="translate(408 330)">
        <rect width="86" height="34" rx="10" fill="#2B1D14" fillOpacity="0.06" stroke="#2B1D14" strokeOpacity="0.1" />
        <text x="43" y="21" fill="#A98448" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Call next →</text>
      </g>
    </Frame>
  );
}

export function AdminLoginScene({ className, label = "An administrator reviewing secure platform analytics" }: IlloProps) {
  return (
    <Frame id="adminlogin" label={label} className={className} tone="brand">
      <g transform="translate(62 58)">
        <rect width="436" height="284" rx="20" fill="#FFFCF6" fillOpacity="0.85" stroke="#2B1D14" strokeOpacity="0.1" />
        <rect x="18" y="18" width="94" height="248" rx="14" fill="#F7F1E7" stroke="#2B1D14" strokeOpacity="0.06" />
        <path d="M40 48 l22 9 v16 c0 15 -9 24 -22 29 c-13 -5 -22 -14 -22 -29 v-16 z" fill="#65452F" fillOpacity="0.28" stroke="#8F6F3E" strokeOpacity="0.55" />
        <path d="M31 70 l6 6 l12 -13" stroke="#8F6F3E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="32" y={116 + i * 26} width="66" height="8" rx="4" fill="#2B1D14" fillOpacity={i === 0 ? 0.16 : 0.06} />
        ))}
        <rect x="128" y="18" width="290" height="104" rx="14" fill="#F7F1E7" stroke="#2B1D14" strokeOpacity="0.06" />
        <text x="146" y="40" fill="#786B60" fontSize="8" fontFamily="sans-serif">PLATFORM ACTIVITY · 14 DAYS</text>
        {[26, 40, 32, 54, 44, 66, 58, 76, 62, 84, 72, 90, 78, 94].map((h, i) => (
          <MiniBar key={i} x={150 + i * 18} y={108} h={h} w={10} color={i > 10 ? "#C7A46A" : "#65452F"} opacity={i > 10 ? 0.9 : 0.55} />
        ))}
        <rect x="128" y="136" width="136" height="130" rx="14" fill="#2B1D14" fillOpacity="0.03" stroke="#2B1D14" strokeOpacity="0.07" />
        <text x="146" y="158" fill="#786B60" fontSize="7" fontFamily="sans-serif">PENDING REVIEW</text>
        <text x="146" y="192" fill="#2B1D14" fontSize="30" fontWeight="700" fontFamily="sans-serif">4</text>
        <rect x="146" y="210" width="100" height="6" rx="3" fill="#C7A46A" fillOpacity="0.6" />
        <rect x="146" y="224" width="70" height="6" rx="3" fill="#2B1D14" fillOpacity="0.08" />
        <rect x="146" y="238" width="88" height="6" rx="3" fill="#2B1D14" fillOpacity="0.08" />
        <rect x="280" y="136" width="138" height="130" rx="14" fill="#2B1D14" fillOpacity="0.03" stroke="#2B1D14" strokeOpacity="0.07" />
        <circle cx="349" cy="192" r="32" fill="none" stroke="#2B1D14" strokeOpacity="0.08" strokeWidth="10" />
        <circle cx="349" cy="192" r="32" fill="none" stroke="#65452F" strokeWidth="10" strokeDasharray="150 201" strokeLinecap="round" transform="rotate(-90 349 192)" />
        <text x="349" y="197" fill="#2B1D14" fontSize="14" textAnchor="middle" fontWeight="700" fontFamily="sans-serif">74%</text>
        <text x="349" y="226" fill="#8A7A6C" fontSize="7" textAnchor="middle" fontFamily="sans-serif">completion</text>
      </g>
      <g transform="translate(444 36)">
        <circle cx="34" cy="34" r="34" fill="#65452F" fillOpacity="0.14" stroke="#8F6F3E" strokeOpacity="0.3" />
        <rect x="22" y="30" width="24" height="18" rx="4" fill="none" stroke="#8F6F3E" strokeWidth="2" />
        <path d="M27 30 v-5 a7 7 0 0 1 14 0 v5" stroke="#8F6F3E" strokeWidth="2" fill="none" />
      </g>
    </Frame>
  );
}

export function PredictionScene({ className, label = "A waiting-time prediction card with a countdown and confidence indicator" }: IlloProps) {
  return (
    <Frame id="predict" label={label} className={className} tone="cyan">
      <g transform="translate(84 58)">
        <rect width="392" height="284" rx="22" fill="#FFFCF6" fillOpacity="0.82" stroke="#2B1D14" strokeOpacity="0.1" />
        <text x="28" y="40" fill="#786B60" fontSize="9" fontFamily="sans-serif" letterSpacing="1.4">SMART WAITING ESTIMATE</text>
        <g transform="translate(28 62)">
          <circle cx="70" cy="70" r="62" fill="none" stroke="#2B1D14" strokeOpacity="0.07" strokeWidth="10" />
          <circle cx="70" cy="70" r="62" fill="none" stroke="#C7A46A" strokeWidth="10" strokeDasharray="270 390" strokeLinecap="round" transform="rotate(-90 70 70)" />
          <circle cx="70" cy="70" r="48" fill="#C7A46A" fillOpacity="0.06" />
          <text x="70" y="65" fill="#2B1D14" fontSize="32" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">14</text>
          <text x="70" y="82" fill="#786B60" fontSize="9" textAnchor="middle" fontFamily="sans-serif">minutes</text>
          <text x="70" y="100" fill="#A98448" fontSize="8" textAnchor="middle" fontFamily="sans-serif">10–18 min range</text>
        </g>
        <g transform="translate(196 62)">
          <rect width="168" height="62" rx="13" fill="#2B1D14" fillOpacity="0.035" stroke="#2B1D14" strokeOpacity="0.07" />
          <text x="16" y="22" fill="#786B60" fontSize="7" fontFamily="sans-serif">PEOPLE AHEAD</text>
          <text x="16" y="48" fill="#2B1D14" fontSize="22" fontWeight="700" fontFamily="sans-serif">2</text>
          <rect x="64" y="26" width="88" height="8" rx="4" fill="#2B1D14" fillOpacity="0.07" />
          <rect x="64" y="26" width="30" height="8" rx="4" fill="#C7A46A" fillOpacity="0.7" />
          <text x="64" y="52" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">queue moving</text>
        </g>
        <g transform="translate(196 134)">
          <rect width="168" height="62" rx="13" fill="#2B1D14" fillOpacity="0.035" stroke="#2B1D14" strokeOpacity="0.07" />
          <text x="16" y="22" fill="#786B60" fontSize="7" fontFamily="sans-serif">CONFIDENCE</text>
          <text x="16" y="45" fill="#5E7A5A" fontSize="11" fontWeight="600" fontFamily="sans-serif">Medium</text>
          <circle cx="126" cy="37" r="14" fill="none" stroke="#2B1D14" strokeOpacity="0.08" strokeWidth="4" />
          <circle cx="126" cy="37" r="14" fill="none" stroke="#5E7A5A" strokeWidth="4" strokeDasharray="60 88" strokeLinecap="round" transform="rotate(-90 126 37)" />
        </g>
        <g transform="translate(28 208)">
          <rect width="336" height="50" rx="13" fill="#65452F" fillOpacity="0.08" stroke="#65452F" strokeOpacity="0.2" />
          <text x="16" y="20" fill="#8F6F3E" fontSize="8" fontFamily="sans-serif">BASED ON</text>
          <text x="16" y="37" fill="#2B1D14" fontSize="8" fontFamily="sans-serif">42 completed visits · 3 active counters</text>
          <circle cx="308" cy="25" r="9" fill="#C7A46A" fillOpacity="0.18" />
          <path d="M304 25 l3 3 l6 -7" stroke="#A98448" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </g>
      </g>
      <g transform="translate(430 92)">
        <rect width="96" height="44" rx="12" fill="#2B1D14" fillOpacity="0.06" stroke="#2B1D14" strokeOpacity="0.1" />
        <text x="48" y="19" fill="#786B60" fontSize="7" textAnchor="middle" fontFamily="sans-serif">UPDATED</text>
        <text x="48" y="33" fill="#A98448" fontSize="10" textAnchor="middle" fontFamily="sans-serif">just now</text>
      </g>
    </Frame>
  );
}

export function MapCompareScene({ className, label = "A map comparing service centres and their waiting times" }: IlloProps) {
  return (
    <Frame id="map" label={label} className={className}>
      <g transform="translate(42 42)">
        <rect width="476" height="316" rx="20" fill="#F7F1E7" stroke="#2B1D14" strokeOpacity="0.1" />
        <g opacity="0.35">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={`v${i}`} d={`M${40 + i * 52} 20 L${20 + i * 52} 296`} stroke="#E4D5C1" strokeWidth="1" />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <path key={`h${i}`} d={`M18 ${40 + i * 52} L458 ${18 + i * 52}`} stroke="#E4D5C1" strokeWidth="1" />
          ))}
          <path d="M0 150 C90 130, 150 190, 240 160 S360 110, 476 148" stroke="#C7A46A" strokeWidth="6" fill="none" opacity="0.18" />
          <path d="M0 76 C120 60, 200 100, 300 70 S400 40, 476 62" stroke="#65452F" strokeWidth="3" fill="none" opacity="0.18" />
        </g>
        <g transform="translate(118 92)">
          <circle cx="0" cy="0" r="18" fill="#65452F" />
          <circle cx="0" cy="0" r="7" fill="#2B1D14" />
          <path d="M18 -8 L90 -24" stroke="#65452F" strokeOpacity="0.4" strokeDasharray="4 4" />
          <g transform="translate(32 -50)">
            <rect width="94" height="34" rx="9" fill="#FFFCF6" stroke="#65452F" strokeOpacity="0.35" />
            <text x="10" y="14" fill="#2B1D14" fontSize="7" fontFamily="sans-serif">Sunrise Hospital</text>
            <text x="10" y="25" fill="#A98448" fontSize="8" fontFamily="sans-serif">~14 min · 1.2 km</text>
          </g>
        </g>
        <g transform="translate(268 216)">
          <circle cx="0" cy="0" r="15" fill="#C7A46A" />
          <circle cx="0" cy="0" r="6" fill="#F2E9DB" />
          <g transform="translate(-84 18)">
            <rect width="92" height="34" rx="9" fill="#FFFCF6" stroke="#C7A46A" strokeOpacity="0.35" />
            <text x="10" y="14" fill="#2B1D14" fontSize="7" fontFamily="sans-serif">ClearView Dx</text>
            <text x="10" y="25" fill="#A98448" fontSize="8" fontFamily="sans-serif">~8 min · 2.4 km</text>
          </g>
        </g>
        <g transform="translate(376 128)">
          <circle cx="0" cy="0" r="14" fill="#5E7A5A" />
          <circle cx="0" cy="0" r="5" fill="#F2E9DB" />
          <g transform="translate(-96 18)">
            <rect width="98" height="34" rx="9" fill="#FFFCF6" stroke="#5E7A5A" strokeOpacity="0.35" />
            <text x="10" y="14" fill="#2B1D14" fontSize="7" fontFamily="sans-serif">Sahyadri Bank</text>
            <text x="10" y="25" fill="#5E7A5A" fontSize="8" fontFamily="sans-serif">~6 min · 3.1 km</text>
          </g>
        </g>
        <g transform="translate(196 134)">
          <circle cx="0" cy="0" r="10" fill="#C7A46A" />
          <circle cx="0" cy="0" r="4" fill="#F6EBD4" />
        </g>
        <g transform="translate(330 246)">
          <circle cx="0" cy="0" r="9" fill="#B4553B" />
          <circle cx="0" cy="0" r="3.5" fill="#F7E3DA" />
        </g>
        <g transform="translate(20 20)">
          <rect width="128" height="34" rx="10" fill="#FFFCF6" stroke="#2B1D14" strokeOpacity="0.1" />
          <circle cx="18" cy="17" r="5" fill="#C7A46A" />
          <text x="30" y="21" fill="#2B1D14" fontSize="8" fontFamily="sans-serif">Compare nearby</text>
        </g>
        <g transform="translate(348 278)">
          <rect width="108" height="24" rx="8" fill="#2B1D14" fillOpacity="0.05" />
          <text x="54" y="16" fill="#786B60" fontSize="7" textAnchor="middle" fontFamily="sans-serif">OpenStreetMap</text>
        </g>
      </g>
    </Frame>
  );
}

export function TicketScene({ className, label = "A digital queue ticket with a QR code and token number" }: IlloProps) {
  return (
    <Frame id="ticket" label={label} className={className}>
      <g transform="translate(126 42)">
        <g transform="rotate(-4 150 155)">
          <rect width="308" height="312" rx="24" fill="#FFFCF6" stroke="#2B1D14" strokeOpacity="0.14" />
          <rect width="308" height="118" rx="24" fill="url(#ticket-a)" fillOpacity="0.16" />
          <rect y="94" width="308" height="24" fill="#FFFCF6" />
          <text x="28" y="40" fill="#8F6F3E" fontSize="9" letterSpacing="1.6" fontFamily="sans-serif">SKIPLINE HUB · VIRTUAL TOKEN</text>
          <text x="28" y="88" fill="#2B1D14" fontSize="42" fontWeight="700" fontFamily="sans-serif">S-015</text>
          <text x="232" y="40" fill="#5E7A5A" fontSize="8" textAnchor="end" fontFamily="sans-serif">● LIVE</text>
          <text x="28" y="144" fill="#786B60" fontSize="9" fontFamily="sans-serif">Sunrise Multispeciality Hospital</text>
          <text x="28" y="162" fill="#8A7A6C" fontSize="8" fontFamily="sans-serif">OPD · General Medicine · Counter 2</text>
          <g transform="translate(28 186)">
            <rect width="108" height="50" rx="10" fill="#2B1D14" fillOpacity="0.04" stroke="#2B1D14" strokeOpacity="0.07" />
            <text x="12" y="18" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">POSITION</text>
            <text x="12" y="38" fill="#2B1D14" fontSize="17" fontWeight="700" fontFamily="sans-serif">3rd</text>
            <rect x="58" y="188" width="108" height="50" rx="10" fill="#2B1D14" fillOpacity="0.04" stroke="#2B1D14" strokeOpacity="0.07" transform="translate(-58 -2)" />
            <text x="70" y="188" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">EST. TURN</text>
            <text x="70" y="208" fill="#A98448" fontSize="15" fontWeight="700" fontFamily="sans-serif">14 min</text>
          </g>
          <g transform="translate(192 186)">
            <rect width="88" height="88" rx="10" fill="#2B1D14" />
            {Array.from({ length: 64 }, (_, i) => {
              const x = (i % 8) * 10 + 6;
              const y = Math.floor(i / 8) * 10 + 6;
              const on = [0, 1, 2, 5, 6, 7, 8, 14, 16, 19, 21, 23, 24, 27, 30, 32, 33, 35, 37, 39, 40, 42, 44, 46, 48, 50, 53, 55, 57, 58, 60, 62, 63].includes(i);
              return on ? <rect key={i} x={x} y={y} width="7" height="7" fill="#F7F1E7" /> : null;
            })}
          </g>
          <text x="28" y="264" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">SHOW THIS QR AT CHECK-IN</text>
          <rect x="28" y="278" width="252" height="1" fill="#2B1D14" fillOpacity="0.07" />
          <text x="28" y="296" fill="#786B60" fontSize="7" fontFamily="sans-serif">Joined 10:32 AM · Queue alerts on</text>
        </g>
      </g>
      <circle cx="92" cy="94" r="4" fill="#A98448" />
      <circle cx="488" cy="140" r="3" fill="#8F6F3E" />
      <circle cx="470" cy="326" r="5" fill="#65452F" fillOpacity="0.5" />
    </Frame>
  );
}

export function AlertScene({ className, label = "A notification alerting a customer that their turn is approaching" }: IlloProps) {
  return (
    <Frame id="alert" label={label} className={className} tone="amber">
      <g transform="translate(166 54)">
        <rect width="228" height="292" rx="28" fill="#FFFCF6" stroke="#2B1D14" strokeOpacity="0.14" />
        <rect x="10" y="18" width="208" height="256" rx="20" fill="#FFFCF6" />
        <rect x="84" y="8" width="60" height="6" rx="3" fill="#E4D5C1" />
        <text x="28" y="48" fill="#786B60" fontSize="8" fontFamily="sans-serif">10:47 AM · Now</text>
        <g transform="translate(24 62)">
          <rect width="180" height="94" rx="16" fill="#C7A46A" fillOpacity="0.08" stroke="#C7A46A" strokeOpacity="0.25" />
          <circle cx="30" cy="32" r="15" fill="#C7A46A" fillOpacity="0.18" />
          <path d="M30 20 c-6 0 -9 5 -9 11 v6 l-3 4 h24 l-3 -4 v-6 c0 -6 -3 -11 -9 -11z" fill="#DCC29A" />
          <text x="54" y="30" fill="#2B1D14" fontSize="10" fontWeight="600" fontFamily="sans-serif">Your turn is close</text>
          <text x="54" y="46" fill="#DCC29A" fontSize="8" fontFamily="sans-serif">Only 2 customers ahead</text>
          <text x="16" y="72" fill="#2B1D14" fontSize="13" fontWeight="700" fontFamily="sans-serif">Token S-015</text>
          <text x="16" y="86" fill="#786B60" fontSize="7" fontFamily="sans-serif">Estimated turn in 12–18 min</text>
        </g>
        <g transform="translate(24 168)">
          <rect width="180" height="72" rx="16" fill="#2B1D14" fillOpacity="0.035" stroke="#2B1D14" strokeOpacity="0.06" />
          <circle cx="28" cy="26" r="12" fill="#C7A46A" fillOpacity="0.14" />
          <path d="M24 26 l3 3 l6 -7" stroke="#A98448" strokeWidth="2" fill="none" strokeLinecap="round" />
          <text x="48" y="24" fill="#2B1D14" fontSize="8" fontFamily="sans-serif">Turn alert enabled</text>
          <text x="48" y="38" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">Browser + in-app</text>
          <rect x="16" y="50" width="148" height="6" rx="3" fill="#2B1D14" fillOpacity="0.06" />
          <rect x="16" y="50" width="96" height="6" rx="3" fill="#C7A46A" fillOpacity="0.5" />
        </g>
        <rect x="24" y="250" width="180" height="14" rx="7" fill="#2B1D14" fillOpacity="0.05" />
      </g>
      <g transform="translate(408 94)">
        <circle cx="34" cy="34" r="34" fill="#C7A46A" fillOpacity="0.12" stroke="#DCC29A" strokeOpacity="0.3" />
        <path d="M34 16 c-8 0 -12 6 -12 14 v8 l-4 5 h32 l-4 -5 v-8 c0 -8 -4 -14 -12 -14z" fill="#DCC29A" fillOpacity="0.9" />
        <circle cx="34" cy="48" r="4" fill="#DCC29A" />
      </g>
      <g transform="translate(92 250)">
        <rect width="104" height="34" rx="10" fill="#2B1D14" fillOpacity="0.05" stroke="#2B1D14" strokeOpacity="0.09" />
        <text x="52" y="21" fill="#DCC29A" fontSize="8" textAnchor="middle" fontFamily="sans-serif">12–18 min</text>
      </g>
    </Frame>
  );
}

export function HindiVoiceScene({ className, label = "Hindi language and voice search assistance" }: IlloProps) {
  return (
    <Frame id="voice" label={label} className={className} tone="brand">
      <g transform="translate(80 76)">
        <rect width="200" height="250" rx="22" fill="#FFFCF6" fillOpacity="0.85" stroke="#2B1D14" strokeOpacity="0.1" />
        <text x="22" y="36" fill="#786B60" fontSize="8" fontFamily="sans-serif">भाषा चुनें / Choose language</text>
        <rect x="22" y="54" width="156" height="50" rx="12" fill="#65452F" fillOpacity="0.16" stroke="#65452F" strokeOpacity="0.4" />
        <text x="38" y="79" fill="#2B1D14" fontSize="15" fontFamily="sans-serif">हिन्दी</text>
        <text x="38" y="94" fill="#8F6F3E" fontSize="8" fontFamily="sans-serif">Hindi</text>
        <circle cx="160" cy="79" r="7" fill="#65452F" />
        <path d="M156 79 l3 3 l5 -6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="22" y="114" width="156" height="50" rx="12" fill="#2B1D14" fillOpacity="0.03" stroke="#2B1D14" strokeOpacity="0.08" />
        <text x="38" y="139" fill="#2B1D14" fontSize="15" fontFamily="sans-serif">English</text>
        <text x="38" y="154" fill="#8A7A6C" fontSize="8" fontFamily="sans-serif">English</text>
        <g transform="translate(22 186)">
          <rect width="156" height="36" rx="10" fill="#C7A46A" fillOpacity="0.08" stroke="#C7A46A" strokeOpacity="0.2" />
          <text x="12" y="23" fill="#A98448" fontSize="8" fontFamily="sans-serif">🔊 आवाज़ सहायता चालू</text>
        </g>
      </g>

      <g transform="translate(310 116)">
        <circle cx="80" cy="80" r="64" fill="#65452F" fillOpacity="0.1" stroke="#65452F" strokeOpacity="0.22" />
        <circle cx="80" cy="80" r="44" fill="url(#voice-a)" fillOpacity="0.22" stroke="#8F6F3E" strokeOpacity="0.5" />
        <rect x="70" y="54" width="20" height="36" rx="10" fill="#8F6F3E" />
        <path d="M60 78 v6 a20 20 0 0 0 40 0 v-6" stroke="#8F6F3E" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M80 104 v10" stroke="#8F6F3E" strokeWidth="3" strokeLinecap="round" />
        <g stroke="#A98448" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M-6 60 a52 52 0 0 1 0 40" opacity="0.35" />
          <path d="M-18 48 a68 68 0 0 1 0 64" opacity="0.2" />
          <path d="M166 60 a52 52 0 0 0 0 40" opacity="0.35" />
          <path d="M178 48 a68 68 0 0 0 0 64" opacity="0.2" />
        </g>
        <text x="80" y="190" fill="#786B60" fontSize="8" textAnchor="middle" fontFamily="sans-serif">&quot;अस्पताल खोजें&quot;</text>
      </g>

      <g transform="translate(318 302)">
        <rect width="150" height="34" rx="10" fill="#2B1D14" fillOpacity="0.04" stroke="#2B1D14" strokeOpacity="0.08" />
        <text x="75" y="21" fill="#786B60" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Voice search fallback ready</text>
      </g>
    </Frame>
  );
}

export function AnalyticsScene({ className, label = "Organisation analytics with visitor charts and peak hour insights" }: IlloProps) {
  return (
    <Frame id="analytics" label={label} className={className} tone="cyan">
      <g transform="translate(58 52)">
        <rect width="444" height="296" rx="20" fill="#FFFCF6" fillOpacity="0.85" stroke="#2B1D14" strokeOpacity="0.1" />
        <text x="24" y="36" fill="#786B60" fontSize="9" fontFamily="sans-serif" letterSpacing="1.4">CROWD ANALYTICS · LAST 14 DAYS</text>
        <rect x="24" y="56" width="206" height="148" rx="14" fill="#F7F1E7" stroke="#2B1D14" strokeOpacity="0.06" />
        {[38, 54, 44, 66, 58, 82, 70, 92, 78, 98, 86, 108].map((h, i) => (
          <MiniBar key={i} x={40 + i * 15} y={188} h={h} w={9} color={i > 8 ? "#C7A46A" : "#65452F"} opacity={i > 8 ? 0.9 : 0.5} />
        ))}
        <path d="M42 152 L56 142 L70 148 L84 128 L98 134 L112 112 L126 118 L140 98 L154 106 L168 86 L182 92 L196 74" stroke="#A98448" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="244" y="56" width="176" height="70" rx="14" fill="#2B1D14" fillOpacity="0.035" stroke="#2B1D14" strokeOpacity="0.06" />
        <text x="260" y="76" fill="#786B60" fontSize="7" fontFamily="sans-serif">AVG. WAITING TIME</text>
        <text x="260" y="102" fill="#2B1D14" fontSize="24" fontWeight="700" fontFamily="sans-serif">12.4 min</text>
        <text x="380" y="100" fill="#5E7A5A" fontSize="8" textAnchor="end" fontFamily="sans-serif">↓ 18%</text>
        <rect x="244" y="134" width="176" height="70" rx="14" fill="#2B1D14" fillOpacity="0.035" stroke="#2B1D14" strokeOpacity="0.06" />
        <text x="260" y="154" fill="#786B60" fontSize="7" fontFamily="sans-serif">BUSIEST HOURS</text>
        <g transform="translate(260 166)">
          {["11am", "5pm", "6pm"].map((hour, i) => (
            <g key={hour} transform={`translate(${i * 50} 0)`}>
              <rect width="42" height="22" rx="6" fill="#C7A46A" fillOpacity={0.18 - i * 0.04} stroke="#C7A46A" strokeOpacity="0.25" />
              <text x="21" y="14" fill="#DCC29A" fontSize="8" textAnchor="middle" fontFamily="sans-serif">{hour}</text>
            </g>
          ))}
        </g>
        <rect x="24" y="220" width="396" height="50" rx="14" fill="#C7A46A" fillOpacity="0.06" stroke="#C7A46A" strokeOpacity="0.16" />
        <text x="40" y="241" fill="#A98448" fontSize="8" fontFamily="sans-serif">3-DAY CROWD FORECAST</text>
        <text x="40" y="258" fill="#2B1D14" fontSize="8" fontFamily="sans-serif">Based on 14 days of recorded visits — an indicative baseline, not a guarantee.</text>
        <g transform="translate(340 232)">
          <rect width="64" height="24" rx="8" fill="#C7A46A" fillOpacity="0.15" />
          <text x="32" y="16" fill="#A98448" fontSize="8" textAnchor="middle" fontFamily="sans-serif">~76 / day</text>
        </g>
      </g>
    </Frame>
  );
}

export function EmergencyScene({ className, label = "Emergency priority support with medical staff and clear guidance" }: IlloProps) {
  return (
    <Frame id="emergency" label={label} className={className} tone="rose">
      <g transform="translate(88 62)">
        <rect width="384" height="280" rx="22" fill="#FFFCF6" fillOpacity="0.85" stroke="#2B1D14" strokeOpacity="0.1" />
        <rect x="24" y="24" width="336" height="58" rx="14" fill="#8E3B2A" fillOpacity="0.1" stroke="#B4553B" strokeOpacity="0.28" />
        <path d="M50 40 l-10 18 h12 l-4 16 16 -22 h-12 l6 -12z" fill="#C46A50" />
        <text x="76" y="48" fill="#F7E3DA" fontSize="10" fontWeight="600" fontFamily="sans-serif">Emergency assessment</text>
        <text x="76" y="64" fill="#786B60" fontSize="8" fontFamily="sans-serif">For life-threatening symptoms call 108 immediately.</text>
        <g transform="translate(24 102)">
          <rect width="200" height="90" rx="14" fill="#2B1D14" fillOpacity="0.035" stroke="#2B1D14" strokeOpacity="0.06" />
          <text x="18" y="24" fill="#786B60" fontSize="7" fontFamily="sans-serif">REQUEST STATUS</text>
          <text x="18" y="48" fill="#C7A46A" fontSize="12" fontWeight="600" fontFamily="sans-serif">Awaiting medical review</text>
          <text x="18" y="66" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">Qualified staff assess priority</text>
          <rect x="18" y="76" width="164" height="4" rx="2" fill="#2B1D14" fillOpacity="0.06" />
          <rect x="18" y="76" width="72" height="4" rx="2" fill="#C7A46A" fillOpacity="0.6" />
        </g>
        <g transform="translate(240 102)">
          <circle cx="60" cy="45" r="45" fill="#8E3B2A" fillOpacity="0.1" stroke="#B4553B" strokeOpacity="0.25" />
          <path d="M52 24 h16 v20 h20 v16 h-20 v20 h-16 v-20 h-20 v-16 h20z" fill="#B4553B" fillOpacity="0.9" />
        </g>
        <g transform="translate(24 210)">
          <rect width="336" height="46" rx="12" fill="#5E7A5A" fillOpacity="0.06" stroke="#5E7A5A" strokeOpacity="0.18" />
          <circle cx="26" cy="23" r="9" fill="#5E7A5A" fillOpacity="0.18" />
          <path d="M22 23 l3 3 l6 -7" stroke="#5E7A5A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <text x="44" y="21" fill="#2B1D14" fontSize="8" fontFamily="sans-serif">Never dependent on payment</text>
          <text x="44" y="34" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">Triage decisions stay with medical staff</text>
        </g>
        <path d="M120 176 h30 l8 -16 l10 32 l8 -16 h30" stroke="#B4553B" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </g>
      <circle cx="474" cy="340" r="4" fill="#B4553B" fillOpacity="0.7" />
      <circle cx="86" cy="96" r="3" fill="#C46A50" fillOpacity="0.6" />
    </Frame>
  );
}

export function FairQueueScene({ className, label = "A transparent and fair queue showing priority status" }: IlloProps) {
  return (
    <Frame id="fair" label={label} className={className} tone="emerald">
      <g transform="translate(70 64)">
        <rect width="420" height="276" rx="20" fill="#FFFCF6" fillOpacity="0.8" stroke="#2B1D14" strokeOpacity="0.09" />
        <text x="24" y="36" fill="#786B60" fontSize="9" fontFamily="sans-serif" letterSpacing="1.4">FAIR QUEUE · TRANSPARENT ORDER</text>
        {[
          ["Emergency", "S-014", "Verified triage", "#B4553B", 0],
          ["Senior citizen", "S-015", "Verified priority", "#C7A46A", 1],
          ["Standard", "S-016", "You", "#C7A46A", 2],
          ["Standard", "S-017", "Waiting", "#786B60", 3],
        ].map(([label, token, note, color, index]) => (
          <g key={token} transform={`translate(24 ${58 + Number(index) * 46})`}>
            <rect width="372" height="38" rx="10" fill={Number(index) === 2 ? "#C7A46A" : "#2B1D14"} fillOpacity={Number(index) === 2 ? 0.08 : 0.03} stroke={Number(index) === 2 ? "#C7A46A" : "#2B1D14"} strokeOpacity={Number(index) === 2 ? 0.25 : 0.06} />
            <circle cx="20" cy="19" r="5" fill={color as string} fillOpacity="0.8" />
            <text x="36" y="17" fill="#2B1D14" fontSize="9" fontFamily="sans-serif">{label}</text>
            <text x="36" y="29" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">{note}</text>
            <text x="352" y="23" fill={Number(index) === 2 ? "#A98448" : "#5F5147"} fontSize="10" textAnchor="end" fontWeight="600" fontFamily="sans-serif">{token}</text>
          </g>
        ))}
        <g transform="translate(24 256)">
          <text x="0" y="0" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">Priority is verified by staff. Queue order is visible to everyone, private details are not.</text>
        </g>
      </g>
      <g transform="translate(494 90)">
        <circle cx="0" cy="0" r="26" fill="#5E7A5A" fillOpacity="0.12" stroke="#5E7A5A" strokeOpacity="0.3" />
        <path d="M-10 0 l7 7 l14 -15" stroke="#5E7A5A" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </Frame>
  );
}

export function StepFindIllo({ className, label = "Find the right service centre" }: IlloProps) {
  return (
    <Frame id="stepfind" label={label} className={className} tone="cyan">
      <g transform="translate(150 78)">
        <rect width="260" height="230" rx="20" fill="#FFFCF6" stroke="#2B1D14" strokeOpacity="0.1" />
        <rect x="20" y="20" width="220" height="40" rx="10" fill="#2B1D14" fillOpacity="0.05" stroke="#2B1D14" strokeOpacity="0.08" />
        <circle cx="42" cy="40" r="7" fill="none" stroke="#A98448" strokeWidth="2" />
        <path d="M47 45 l6 6" stroke="#A98448" strokeWidth="2" strokeLinecap="round" />
        <text x="62" y="44" fill="#8A7A6C" fontSize="9" fontFamily="sans-serif">Search services near you</text>
        {["Hospital · 12 min", "Bank · 6 min", "Diagnostics · 8 min"].map((row, i) => (
          <g key={row} transform={`translate(20 ${78 + i * 44})`}>
            <rect width="220" height="36" rx="9" fill={i === 0 ? "#C7A46A" : "#2B1D14"} fillOpacity={i === 0 ? 0.08 : 0.03} stroke="#2B1D14" strokeOpacity="0.06" />
            <circle cx="20" cy="18" r="6" fill={i === 0 ? "#C7A46A" : "#65452F"} fillOpacity="0.5" />
            <text x="36" y="21" fill="#5F5147" fontSize="8" fontFamily="sans-serif">{row}</text>
          </g>
        ))}
      </g>
      <circle cx="110" cy="110" r="34" fill="none" stroke="#C7A46A" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M110 82 c-14 0 -20 10 -20 22 c0 15 20 32 20 32 s20 -17 20 -32 c0 -12 -6 -22 -20 -22z" fill="#C7A46A" fillOpacity="0.18" stroke="#A98448" strokeOpacity="0.6" />
      <circle cx="110" cy="104" r="7" fill="#A98448" />
    </Frame>
  );
}

export function StepJoinIllo({ className, label = "Join a queue or book an appointment slot" }: IlloProps) {
  return (
    <Frame id="stepjoin" label={label} className={className} tone="brand">
      <g transform="translate(154 72)">
        <rect width="252" height="242" rx="20" fill="#FFFCF6" stroke="#2B1D14" strokeOpacity="0.1" />
        <text x="22" y="34" fill="#786B60" fontSize="8" fontFamily="sans-serif">CHOOSE A SLOT</text>
        {["10:15 AM", "10:30 AM", "10:45 AM", "11:00 AM"].map((slot, i) => (
          <g key={slot} transform={`translate(22 ${48 + i * 34})`}>
            <rect width="208" height="26" rx="7" fill={i === 1 ? "#65452F" : "#2B1D14"} fillOpacity={i === 1 ? 0.2 : 0.03} stroke={i === 1 ? "#65452F" : "#2B1D14"} strokeOpacity={i === 1 ? 0.5 : 0.06} />
            <text x="12" y="17" fill={i === 1 ? "#F1E6D2" : "#786B60"} fontSize="8" fontFamily="sans-serif">{slot}</text>
            <text x="196" y="17" fill={i === 1 ? "#8F6F3E" : "#786B60"} fontSize="7" textAnchor="end" fontFamily="sans-serif">{i === 1 ? "Selected" : "Available"}</text>
          </g>
        ))}
        <rect x="22" y="194" width="208" height="30" rx="8" fill="#65452F" />
        <text x="126" y="213" fill="#fff" fontSize="9" textAnchor="middle" fontWeight="600" fontFamily="sans-serif">Take token</text>
      </g>
      <g transform="translate(92 182)">
        <rect width="52" height="52" rx="12" fill="#65452F" fillOpacity="0.15" stroke="#65452F" strokeOpacity="0.3" transform="rotate(-8 26 26)" />
        <text x="26" y="33" fill="#8F6F3E" fontSize="14" textAnchor="middle" fontWeight="700" fontFamily="sans-serif" transform="rotate(-8 26 26)">S-15</text>
      </g>
    </Frame>
  );
}

export function StepTrackIllo({ className, label = "Track queue position and receive alerts" }: IlloProps) {
  return (
    <Frame id="steptrack" label={label} className={className} tone="amber">
      <g transform="translate(140 82)">
        <rect width="280" height="222" rx="20" fill="#FFFCF6" stroke="#2B1D14" strokeOpacity="0.1" />
        <text x="24" y="36" fill="#786B60" fontSize="8" fontFamily="sans-serif">LIVE QUEUE POSITION</text>
        <text x="24" y="76" fill="#2B1D14" fontSize="34" fontWeight="700" fontFamily="sans-serif">You&apos;re 3rd</text>
        <text x="24" y="96" fill="#A98448" fontSize="9" fontFamily="sans-serif">2 people ahead · ~14 min</text>
        <rect x="24" y="114" width="232" height="8" rx="4" fill="#2B1D14" fillOpacity="0.06" />
        <rect x="24" y="114" width="128" height="8" rx="4" fill="url(#steptrack-a)" />
        <circle cx="152" cy="118" r="8" fill="#DCC29A" stroke="#FFFCF6" strokeWidth="3" />
        {[24, 100, 176, 248].map((x, i) => (
          <circle key={x} cx={x} cy="118" r="3" fill={x <= 152 ? "#C7A46A" : "#9C8B7B"} />
        ))}
        <g transform="translate(24 142)">
          <rect width="232" height="56" rx="12" fill="#C7A46A" fillOpacity="0.07" stroke="#C7A46A" strokeOpacity="0.18" />
          <circle cx="24" cy="28" r="11" fill="#C7A46A" fillOpacity="0.16" />
          <path d="M24 20 c-5 0 -7 4 -7 8 v4 l-2 3 h18 l-2 -3 v-4 c0 -4 -2 -8 -7 -8z" fill="#DCC29A" />
          <text x="44" y="25" fill="#2B1D14" fontSize="8" fontFamily="sans-serif">Turn alert active</text>
          <text x="44" y="39" fill="#8A7A6C" fontSize="7" fontFamily="sans-serif">We&apos;ll notify you when you&apos;re next</text>
        </g>
      </g>
    </Frame>
  );
}

export function StepServedIllo({ className, label = "Check in with a QR token and get served" }: IlloProps) {
  return (
    <Frame id="stepserved" label={label} className={className} tone="emerald">
      <g transform="translate(152 74)">
        <rect width="256" height="240" rx="20" fill="#FFFCF6" stroke="#2B1D14" strokeOpacity="0.1" />
        <text x="24" y="34" fill="#786B60" fontSize="8" fontFamily="sans-serif">CHECK-IN TOKEN</text>
        <g transform="translate(24 50)">
          <rect width="96" height="96" rx="12" fill="#2B1D14" />
          {Array.from({ length: 36 }, (_, i) => {
            const x = (i % 6) * 14 + 7;
            const y = Math.floor(i / 6) * 14 + 7;
            return [0, 1, 5, 6, 7, 8, 12, 14, 17, 18, 20, 22, 23, 25, 27, 29, 30, 32, 35].includes(i) ? (
              <rect key={i} x={x} y={y} width="10" height="10" fill="#F7F1E7" />
            ) : null;
          })}
        </g>
        <text x="136" y="76" fill="#2B1D14" fontSize="22" fontWeight="700" fontFamily="sans-serif">S-015</text>
        <text x="136" y="96" fill="#786B60" fontSize="8" fontFamily="sans-serif">Counter 2 · OPD</text>
        <rect x="136" y="108" width="96" height="38" rx="9" fill="#5E7A5A" fillOpacity="0.12" stroke="#5E7A5A" strokeOpacity="0.3" />
        <text x="184" y="124" fill="#5E7A5A" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Verified</text>
        <text x="184" y="136" fill="#8A7A6C" fontSize="7" textAnchor="middle" fontFamily="sans-serif">Check-in complete</text>
        <rect x="24" y="166" width="208" height="48" rx="11" fill="#2B1D14" fillOpacity={0.035} stroke="#2B1D14" strokeOpacity="0.06" />
        <text x="38" y="185" fill="#786B60" fontSize="7" fontFamily="sans-serif">SERVICE STATUS</text>
        <text x="38" y="202" fill="#5E7A5A" fontSize="10" fontFamily="sans-serif">Completed · thank you</text>
      </g>
      <g transform="translate(94 108)">
        <circle cx="30" cy="30" r="30" fill="#5E7A5A" fillOpacity="0.12" stroke="#5E7A5A" strokeOpacity="0.3" />
        <path d="M17 30 l9 9 l19 -21" stroke="#5E7A5A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>
      <circle cx="470" cy="298" r="4" fill="#5E7A5A" fillOpacity="0.6" />
    </Frame>
  );
}
