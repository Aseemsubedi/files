const CoffeeBean = ({ size = 64, tone = "#7a3a18", light = "#fff6ec" }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    <ellipse cx="32" cy="32" rx="15" ry="26" fill={tone} />
    <path
      d="M32 8c-3.5 7-5 14-5 24s1.5 17 5 24"
      fill="none"
      stroke={light}
      strokeWidth="3.2"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
)

const CoffeeCup = ({ size = 96, tone = "#c4622d", light = "#fff6ec" }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <path
      d="M22 8c-3 5 5 8 0 14M46 8c-3 5 5 8 0 14M70 8c-3 5 5 8 0 14"
      stroke={tone}
      strokeWidth="4.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.9"
    />
    <path d="M10 38h70v26a22 22 0 0 1-22 22H32a22 22 0 0 1-22-22z" fill={tone} />
    <path
      d="M80 44h8a14 14 0 0 1 0 28h-8"
      fill="none"
      stroke={tone}
      strokeWidth="6"
      strokeLinecap="round"
    />
    <rect x="16" y="40" width="58" height="5" rx="2.5" fill={light} opacity="0.55" />
  </svg>
)

const Samosa = ({ size = 120, tone = "#d8903e", light = "#fff6ec" }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <path d="M12 82 L50 12 L88 82 Z" fill={tone} />
    <path
      d="M50 14 L50 68"
      stroke={light}
      strokeWidth="2.8"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path
      d="M12 82 Q18 74 24 82 Q30 74 36 82 Q42 74 48 82 Q54 74 60 82 Q66 74 72 82 Q78 74 84 82 Q90 74 96 82"
      stroke={light}
      strokeWidth="3.4"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
)

const Croissant = ({ size = 130, tone = "#d4872e", light = "#fff6ec" }) => (
  <svg viewBox="0 0 130 80" width={size} height={(size * 80) / 130}>
    <path
      d="M12 58c0-22 20-40 46-40 12 0 20 5 20 14 0 6-5 10-10 10-14 0-24 5-28 16-4 10-12 16-20 16-4 0-8-2-8-16z"
      fill={tone}
    />
    <path
      d="M30 42c3 3 3 8 0 11M46 34c3 3 3 8 0 11M62 30c3 3 3 8 0 11M76 32c3 3 3 8 0 11"
      stroke={light}
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="none"
      opacity="0.75"
    />
  </svg>
)

const Donut = ({ size = 110, tone = "#6f3e8c", icing = "#ec6f8b", light = "#fff6ec" }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <circle cx="50" cy="50" r="38" fill={tone} />
    <path
      d="M12 46 Q22 32 32 40 Q40 28 50 36 Q60 28 68 40 Q78 32 88 46 L88 54 Q78 42 68 50 Q60 40 50 48 Q40 40 32 50 Q22 42 12 54 Z"
      fill={icing}
    />
    <circle cx="50" cy="50" r="13" fill={light} />
    <rect x="22" y="44" width="7" height="2.6" rx="1.3" fill={light} transform="rotate(40 25 45)" />
    <rect x="68" y="54" width="7" height="2.6" rx="1.3" fill={light} transform="rotate(-25 71 55)" />
    <rect x="38" y="68" width="7" height="2.6" rx="1.3" fill={light} transform="rotate(60 41 69)" />
    <rect x="62" y="28" width="7" height="2.6" rx="1.3" fill={light} transform="rotate(-60 65 29)" />
  </svg>
)

const Cookie = ({ size = 100, tone = "#a9541f", chip = "#3b2615" }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <circle cx="50" cy="50" r="38" fill={tone} />
    <circle cx="34" cy="36" r="4" fill={chip} />
    <circle cx="58" cy="34" r="3.4" fill={chip} />
    <circle cx="44" cy="54" r="3.6" fill={chip} />
    <circle cx="64" cy="58" r="4" fill={chip} />
    <circle cx="34" cy="62" r="3" fill={chip} />
  </svg>
)

const items = [
  { Cmp: CoffeeCup, pos: { top: "11%", right: "6%" }, size: 92, rotate: 6, anim: "drift", delay: "0s" },
  { Cmp: Samosa, pos: { bottom: "14%", left: "4%" }, size: 82, rotate: -8, anim: "float", delay: "0.6s" },
  { Cmp: Croissant, pos: { top: "48%", right: "3%" }, size: 92, rotate: 14, anim: "bob", delay: "1.2s" },
  { Cmp: Donut, pos: { bottom: "8%", right: "7%" }, size: 74, rotate: -12, anim: "spin", delay: "0.3s" },
  { Cmp: Cookie, pos: { top: "46%", left: "3%" }, size: 68, rotate: 10, anim: "wobble", delay: "1.8s" },
  { Cmp: CoffeeBean, pos: { top: "9%", left: "6%" }, size: 48, rotate: -22, anim: "float", delay: "0.4s" },
  { Cmp: CoffeeBean, pos: { top: "22%", right: "26%" }, size: 30, rotate: 35, anim: "wobble", delay: "1.0s" },
  { Cmp: CoffeeBean, pos: { top: "70%", left: "38%" }, size: 26, rotate: -16, anim: "bob", delay: "2.4s" },
  { Cmp: CoffeeBean, pos: { top: "32%", left: "46%" }, size: 22, rotate: 48, anim: "drift", delay: "1.6s" },
  { Cmp: CoffeeBean, pos: { bottom: "26%", right: "32%" }, size: 20, rotate: -28, anim: "float", delay: "2.8s" }
]

export default function HomeBackgroundIcons() {
  return (
    <div className="home-bg-icons" aria-hidden="true">
      {items.map(({ Cmp, pos, size, rotate, anim, delay }, i) => (
        <span
          key={i}
          className={`home-bg-icon home-bg-icon--${anim}`}
          style={{
            ...pos,
            "--r": `${rotate}deg`,
            animationDelay: delay
          }}
        >
          <Cmp size={size} />
        </span>
      ))}
    </div>
  )
}
