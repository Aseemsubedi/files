import Link from "next/link"
import DrinkIcon from "../components/DrinkIcon"
import HomeBackgroundIcons from "../components/HomeBackgroundIcons"
import Nav from "../components/Nav"

const tiles = [
  { href: "/drinks", title: "Drinks", subtitle: "Hot coffee · Iced · Boba · Shakes", soon: false, icon: "hot", iconBg: "#FBEFE3", iconStroke: "#7a3a18" },
  { href: "/menu/food", title: "Food", subtitle: "Meals · Snacks · Loaded bites", soon: false, icon: "food", iconBg: "#EEF5F3", iconStroke: "#245543" },
  { href: "/menu/desserts", title: "Dessert", subtitle: "Eggless vegetarian pastries", soon: false, icon: "desserts", iconBg: "#F6EEF9", iconStroke: "#6f3e8c" }
]

export default function HomePage() {
  return (
    <div className="page home-animated-bg">
      <div className="home-bg-orb home-bg-orb-a" />
      <div className="home-bg-orb home-bg-orb-b" />
      <div className="home-bg-orb home-bg-orb-c" />
      <HomeBackgroundIcons />
      <Nav />
      <main className="container" style={{ padding: "42px 0 56px" }}>
        <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--terra)" }}>Local delivery · within 5km</p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", marginBottom: 10 }}>
          Great coffee.
          <br />
          Real food.
          <br />
          Delivered fresh.
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 520, marginBottom: 30 }}>
          Your neighbourhood cafe delivers hot drinks, iced coffees and more straight to your door.
        </p>
        <div className="grid-3">
          {tiles.map((tile) => (
            <Link
              key={tile.title}
              href={tile.soon ? "#" : tile.href}
              className="card"
              style={{
                padding: 22,
                pointerEvents: tile.soon ? "none" : "auto",
                opacity: tile.soon ? 0.6 : 1
              }}
            >
              <div className="icon-badge" style={{ background: tile.iconBg, marginBottom: 10 }}>
                <DrinkIcon kind={tile.icon} size={30} stroke={tile.iconStroke} />
              </div>
              <h2>{tile.title}</h2>
              <p style={{ color: "var(--muted)" }}>{tile.subtitle}</p>
              {tile.soon && (
                <span className="pill" style={{ background: "rgba(26,23,16,.08)", color: "var(--muted)" }}>
                  Coming soon
                </span>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
