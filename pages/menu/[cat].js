import Link from "next/link"
import { useRouter } from "next/router"
import { useEffect, useMemo, useState } from "react"
import BottomSheet from "../../components/BottomSheet"
import CartPanel from "../../components/CartPanel"
import DrinkIcon from "../../components/DrinkIcon"
import Nav from "../../components/Nav"
import { useCart } from "../../lib/cartContext"
import { CATEGORIES, formatMoney, hasBothSizes, MENU } from "../../lib/menu"

export default function MenuPage({ initialCat = "" }) {
  const router = useRouter()
  const cat = String(router.query.cat || initialCat || "")
  const { addItem, selectedIds } = useCart()
  const [openItem, setOpenItem] = useState(null)
  const [filter, setFilter] = useState("all")
  const [availabilityMap, setAvailabilityMap] = useState({})

  const category = CATEGORIES[cat]
  const isFood = cat === "food"
  const isDesserts = cat === "desserts"
  const isSimpleCategory = isDesserts || isFood
  const allItems = MENU[cat] || []
  const items = useMemo(() => {
    if (filter === "single") return allItems.filter((i) => !hasBothSizes(i))
    if (filter === "multi") return allItems.filter((i) => hasBothSizes(i))
    return allItems
  }, [allItems, filter])
  const availableItems = items.filter((item) => availabilityMap[item.id] !== false)
  const foodGroups = useMemo(() => {
    const groups = []
    availableItems.forEach((item) => {
      const key = item.group || "Menu"
      const existing = groups.find((entry) => entry.key === key)
      if (existing) existing.items.push(item)
      else groups.push({ key, items: [item] })
    })
    return groups
  }, [availableItems])

  useEffect(() => {
    let mounted = true
    fetch("/api/menu-availability")
      .then((res) => res.json())
      .then((json) => {
        if (mounted && json && typeof json === "object") setAvailabilityMap(json)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  if (!category || category.soon) {
    return (
      <div className="page">
        <Nav />
        <main className="container" style={{ padding: "40px 0" }}>
          <h1>Menu not found</h1>
          <Link href="/drinks">Back to drinks</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <Nav />
      <main className="container" style={{ padding: "24px 0 56px" }}>
        <p style={{ color: "var(--muted)" }}>
          <Link href={isSimpleCategory ? "/" : "/drinks"}>{isSimpleCategory ? "Home" : "Drinks"}</Link> / {category.label}
        </p>
        <h1>{isDesserts ? "Pastries (Eggless & Vegetarian)" : isFood ? "Chatpata Lane - Menu" : category.label}</h1>
        {isDesserts ? (
          <>
            <p style={{ color: "var(--muted)", marginBottom: 6 }}>Freshly made, 100% vegetarian pastries</p>
          </>
        ) : isFood ? (
          <p style={{ color: "var(--muted)" }}>Street food specials and snacks menu.</p>
        ) : (
          <p style={{ color: "var(--muted)" }}>{category.desc}</p>
        )}
        <div className="menu-layout" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
          <div>
            {!isSimpleCategory ? (
              <div className="menu-filters" style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[
                  { id: "all", label: "All" },
                  { id: "single", label: "Single size" },
                  { id: "multi", label: "Small & Regular" }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className="btn btn-secondary"
                    style={{ background: filter === f.id ? "var(--ink)" : "white", color: filter === f.id ? "white" : "var(--ink)" }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            ) : null}
            {isFood ? (
              <div style={{ display: "grid", gap: 14 }}>
                {foodGroups.map((group) => (
                  <section key={group.key} className="card" style={{ padding: 14 }}>
                    <h3 style={{ marginBottom: 10 }}>{group.key}</h3>
                    <div className="menu-items-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 12 }}>
                      {group.items.map((item) => {
                        const price = item.small ?? item.regular
                        return (
                          <button
                            key={item.id}
                            className="card"
                            type="button"
                            onClick={() => setOpenItem(item)}
                            style={{
                              padding: 14,
                              textAlign: "left",
                              cursor: "pointer",
                              border: selectedIds.has(item.id) ? "2px solid var(--terra)" : "1px solid var(--border)",
                              boxShadow: selectedIds.has(item.id) ? "0 0 0 4px rgba(196,98,45,.12)" : "none"
                            }}
                          >
                            <div
                              className="icon-badge"
                              style={{ width: 46, height: 46, marginBottom: 8, background: "#EEF5F3" }}
                            >
                              <DrinkIcon kind="food" size={26} stroke="#245543" />
                            </div>
                            <h3 style={{ marginBottom: 4 }}>{item.name}</h3>
                            <p style={{ margin: 0, color: "var(--muted)", minHeight: 42 }}>{item.note}</p>
                            <div style={{ marginTop: 10, fontWeight: 700 }}>
                              {formatMoney(price)}
                              {item.spiceOptions?.length ? (
                                <small style={{ color: "var(--muted)", marginLeft: 6 }}>
                                  Spice: {item.spiceOptions.join(" | ")}
                                </small>
                              ) : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="menu-items-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14 }}>
                {availableItems.map((item) => {
                  const price = item.small ?? item.regular
                  return (
                    <button
                      key={item.id}
                      className="card"
                      type="button"
                      onClick={() => setOpenItem(item)}
                      style={{
                        padding: 14,
                        textAlign: "left",
                        cursor: "pointer",
                        border: selectedIds.has(item.id) ? "2px solid var(--terra)" : "1px solid var(--border)",
                        boxShadow: selectedIds.has(item.id) ? "0 0 0 4px rgba(196,98,45,.12)" : "none"
                      }}
                    >
                      <div
                        className="icon-badge"
                        style={{
                          width: 46,
                          height: 46,
                          marginBottom: 8,
                          background: isDesserts ? "#F6EEF9" : cat === "iced" ? "#EAF5F0" : "#FBEFE3"
                        }}
                      >
                        <DrinkIcon
                          kind={cat}
                          size={26}
                          stroke={isDesserts ? "#6f3e8c" : cat === "iced" ? "#20543B" : "#7a3a18"}
                        />
                      </div>
                      <h3 style={{ marginBottom: 4 }}>{item.name}</h3>
                      <p style={{ margin: 0, color: "var(--muted)", minHeight: 42 }}>{item.note}</p>
                      <div style={{ marginTop: 10, fontWeight: 700 }}>
                        {formatMoney(price)}
                        {hasBothSizes(item) ? <small style={{ color: "var(--muted)", marginLeft: 6 }}>to {formatMoney(item.regular)}</small> : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <CartPanel compactOnMobile />
        </div>
      </main>
      {openItem ? (
        <BottomSheet
          item={openItem}
          catId={cat}
          onClose={() => setOpenItem(null)}
          onAdd={(line) => {
            addItem(line)
            setOpenItem(null)
          }}
        />
      ) : null}
    </div>
  )
}

export async function getServerSideProps({ params }) {
  return {
    props: {
      initialCat: params?.cat || ""
    }
  }
}
