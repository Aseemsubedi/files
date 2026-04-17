import Link from "next/link"
import DrinkIcon from "../components/DrinkIcon"
import Nav from "../components/Nav"
import { CATEGORIES } from "../lib/menu"

export default function DrinksPage() {
  const cards = Object.values(CATEGORIES).filter((cat) => cat.id !== "desserts" && cat.id !== "food")
  return (
    <div className="page">
      <Nav />
      <main className="container" style={{ padding: "30px 0 56px" }}>
        <p style={{ color: "var(--muted)", marginBottom: 6 }}>
          <Link href="/">Home</Link> / Drinks
        </p>
        <h1 style={{ fontSize: 40, marginBottom: 8 }}>Drinks</h1>
        <p style={{ color: "var(--muted)", marginBottom: 20 }}>Pick a category and explore the menu.</p>
        <div className="grid-3">
          {cards.map((cat) => (
            <Link
              key={cat.id}
              href={cat.soon ? "#" : `/menu/${cat.id}`}
              className="card"
              style={{ padding: 20, pointerEvents: cat.soon ? "none" : "auto", opacity: cat.soon ? 0.6 : 1 }}
            >
              <div
                className="icon-badge"
                style={{
                  marginBottom: 10,
                  background: cat.id === "iced" ? "#EAF5F0" : "#FBEFE3"
                }}
              >
                <DrinkIcon kind={cat.id} size={30} stroke={cat.id === "iced" ? "#20543B" : "#7a3a18"} />
              </div>
              <h2>{cat.label}</h2>
              <p style={{ color: "var(--muted)" }}>{cat.desc}</p>
              {cat.soon ? <span className="pill" style={{ background: "var(--ink)", color: "white" }}>Soon</span> : null}
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
