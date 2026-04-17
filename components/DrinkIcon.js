export default function DrinkIcon({ kind = "hot", size = 42, stroke = "#6b3518" }) {
  if (kind === "iced") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <rect x="28" y="20" width="44" height="62" rx="10" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.35)" />
        <path d="M38 30h24" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        <circle cx="42" cy="52" r="5" stroke={stroke} strokeWidth="2.5" />
        <circle cx="56" cy="60" r="6" stroke={stroke} strokeWidth="2.5" />
        <path d="M60 8 75 24" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === "bubble") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path d="M40 8 64 34" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
        <rect x="27" y="26" width="46" height="54" rx="12" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.35)" />
        <circle cx="40" cy="66" r="4.2" fill={stroke} />
        <circle cx="50" cy="71" r="4.2" fill={stroke} />
        <circle cx="60" cy="66" r="4.2" fill={stroke} />
      </svg>
    )
  }

  if (kind === "shakes") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path d="M33 32h34l-5 44H38z" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.35)" />
        <path d="M30 32c0-6 5-11 11-11h18c6 0 11 5 11 11" stroke={stroke} strokeWidth="3" />
        <path d="M52 16c2 5 7 7 10 11" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M51 6v10" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === "desserts") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path d="M18 66h64l-5 18H23z" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.35)" />
        <path d="M28 66c0-14 10-24 22-24 8 0 14 4 18 10 3-2 7-3 10-3 8 0 14 7 14 17" stroke={stroke} strokeWidth="3" />
        <circle cx="48" cy="32" r="4" stroke={stroke} strokeWidth="2.5" />
      </svg>
    )
  }

  if (kind === "food") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path d="M28 18v26M38 18v26M48 18v26" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        <path d="M33 44v36" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        <path d="M66 18c-9 0-12 8-12 16s4 14 12 14V18z" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.35)" />
        <path d="M66 48v32" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M28 34h44l-4 38c-.6 6-4.7 10-11 10H43c-6.3 0-10.4-4-11-10z" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.35)" />
      <path d="M72 42h8c8 0 8 14 0 14h-8" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <path d="M38 10c2 5-2 9-2 13M49 10c2 5-2 9-2 13M60 10c2 5-2 9-2 13" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
