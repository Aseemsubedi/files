import { useMemo, useState } from "react"
import { ADDONS, BUBBLE_TEA_CUSTOMIZATION, BUBBLE_TEA_TOPPINGS, formatMoney, getBasePrice, hasBothSizes, MILKSHAKE_MILK_CHOICES } from "../lib/menu"

function totalAddon(ids, list) {
  return ids.reduce((sum, id) => sum + (list.find((x) => x.id === id)?.price || 0), 0)
}

export default function BottomSheet({ item, catId, onClose, onAdd }) {
  const isBubbleTeaCustom = item.customisationType === "bubble-tea"
  const isMilkshakeCustom = item.customisationType === "milkshake"
  const [size, setSize] = useState(item.regular !== undefined ? "regular" : "small")
  const [milk, setMilk] = useState(isMilkshakeCustom ? MILKSHAKE_MILK_CHOICES[0].id : ADDONS.milk[0].id)
  const [sugar, setSugar] = useState(isBubbleTeaCustom ? BUBBLE_TEA_CUSTOMIZATION.sugarLevels[3] : ADDONS.sugar[0].id)
  const [ice, setIce] = useState(isBubbleTeaCustom ? BUBBLE_TEA_CUSTOMIZATION.iceLevels[3] : null)
  const [syrups, setSyrups] = useState([])
  const [extras, setExtras] = useState([])
  const [spice, setSpice] = useState(item.spiceOptions?.[0] || null)
  const [water, setWater] = useState(item.waterOptions?.[0] || null)
  const [qty, setQty] = useState(1)

  const unitPrice = useMemo(() => {
    const base = getBasePrice(item, size)
    if (isBubbleTeaCustom) {
      return base + totalAddon(extras, BUBBLE_TEA_TOPPINGS.options)
    }
    if (isMilkshakeCustom) {
      const milkCost = MILKSHAKE_MILK_CHOICES.find((m) => m.id === milk)?.price || 0
      return base + milkCost + totalAddon(extras, BUBBLE_TEA_TOPPINGS.options)
    }
    const milkCost = ADDONS.milk.find((m) => m.id === milk)?.price || 0
    return base + milkCost + totalAddon(syrups, ADDONS.syrups) + totalAddon(extras, ADDONS.extras)
  }, [item, size, milk, syrups, extras, isBubbleTeaCustom, isMilkshakeCustom])

  const lineTotal = unitPrice * qty

  const toggle = (value, setter, current) => {
    if (current.includes(value)) setter(current.filter((x) => x !== value))
    else setter([...current, value])
  }

  const toLabel = (key, id) => ADDONS[key].find((x) => x.id === id)?.label

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16,14,10,.55)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 40
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          margin: "0 auto",
          background: "white",
          borderRadius: "20px 20px 0 0",
          padding: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <h3>{item.name}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-secondary"
            style={{
              minWidth: 40,
              minHeight: 40,
              lineHeight: 1,
              fontSize: 22,
              padding: "6px 10px",
              borderRadius: 12
            }}
          >
            ×
          </button>
        </div>
        <p style={{ color: "var(--muted)" }}>{item.note}</p>

        {item.spiceOptions?.length ? (
          <Section title="Spice Level">
            {item.spiceOptions.map((level) => (
              <Chip key={level} onClick={() => setSpice(level)} active={spice === level}>
                {level}
              </Chip>
            ))}
          </Section>
        ) : null}

        {item.waterOptions?.length ? (
          <Section title="Water Choice">
            {item.waterOptions.map((opt) => (
              <Chip key={opt} onClick={() => setWater(opt)} active={water === opt}>
                {opt}
              </Chip>
            ))}
          </Section>
        ) : null}

        {!item.noCustomisation && (
          <>
            {hasBothSizes(item) && (
              <Section title="Size">
                <Chip onClick={() => setSize("small")} active={size === "small"}>
                  Small {formatMoney(item.small)}
                </Chip>
                <Chip onClick={() => setSize("regular")} active={size === "regular"}>
                  Regular {formatMoney(item.regular)}
                </Chip>
              </Section>
            )}

            {isBubbleTeaCustom ? (
              <>
                <Section title="Sugar Degree">
                  {BUBBLE_TEA_CUSTOMIZATION.sugarLevels.map((level) => (
                    <Chip key={level} onClick={() => setSugar(level)} active={sugar === level}>
                      {level}
                    </Chip>
                  ))}
                </Section>

                <Section title="Ice Degree">
                  {BUBBLE_TEA_CUSTOMIZATION.iceLevels.map((level) => (
                    <Chip key={level} onClick={() => setIce(level)} active={ice === level}>
                      {level}
                    </Chip>
                  ))}
                </Section>

                <Section title={`Toppings (${formatMoney(BUBBLE_TEA_TOPPINGS.unitPrice)} each)`}>
                  {BUBBLE_TEA_TOPPINGS.options.map((topping) => (
                    <Chip key={topping.id} onClick={() => toggle(topping.id, setExtras, extras)} active={extras.includes(topping.id)}>
                      {topping.label}
                    </Chip>
                  ))}
                </Section>
              </>
            ) : isMilkshakeCustom ? (
              <>
                <Section title="Milk Choice">
                  {MILKSHAKE_MILK_CHOICES.map((choice) => (
                    <Chip key={choice.id} onClick={() => setMilk(choice.id)} active={milk === choice.id}>
                      {choice.label} {choice.price ? `+${formatMoney(choice.price)}` : ""}
                    </Chip>
                  ))}
                </Section>

                <Section title={`Toppings (${formatMoney(BUBBLE_TEA_TOPPINGS.unitPrice)} each)`}>
                  {BUBBLE_TEA_TOPPINGS.options.map((topping) => (
                    <Chip key={topping.id} onClick={() => toggle(topping.id, setExtras, extras)} active={extras.includes(topping.id)}>
                      {topping.label}
                    </Chip>
                  ))}
                </Section>
              </>
            ) : (
              <>
                <Section title="Milk">
                  {ADDONS.milk.map((m) => (
                    <Chip key={m.id} onClick={() => setMilk(m.id)} active={milk === m.id}>
                      {m.label} {m.price ? `+${formatMoney(m.price)}` : ""}
                    </Chip>
                  ))}
                </Section>

                <Section title="Sugar">
                  {ADDONS.sugar.map((s) => (
                    <Chip key={s.id} onClick={() => setSugar(s.id)} active={sugar === s.id}>
                      {s.label}
                    </Chip>
                  ))}
                </Section>

                <Section title="Syrups">
                  {ADDONS.syrups.map((s) => (
                    <Chip key={s.id} onClick={() => toggle(s.id, setSyrups, syrups)} active={syrups.includes(s.id)}>
                      {s.label} +{formatMoney(s.price)}
                    </Chip>
                  ))}
                </Section>

                <Section title="Extras">
                  {ADDONS.extras.map((e) => (
                    <Chip key={e.id} onClick={() => toggle(e.id, setExtras, extras)} active={extras.includes(e.id)}>
                      {e.label} {e.price ? `+${formatMoney(e.price)}` : ""}
                    </Chip>
                  ))}
                </Section>
              </>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn-secondary" type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              -
            </button>
            <strong>{qty}</strong>
            <button className="btn btn-secondary" type="button" onClick={() => setQty((q) => q + 1)}>
              +
            </button>
          </div>
          <button
            className="btn"
            style={{ flex: 1, background: "var(--terra)" }}
            onClick={() =>
              onAdd({
                uid: `${item.id}-${Date.now()}`,
                id: item.id,
                name: item.name,
                catId,
                size: hasBothSizes(item) ? size : null,
                spice: spice || null,
                water: water || null,
                milk: item.noCustomisation
                  ? null
                  : isMilkshakeCustom
                    ? MILKSHAKE_MILK_CHOICES.find((x) => x.id === milk)?.label || null
                    : isBubbleTeaCustom
                      ? null
                      : toLabel("milk", milk),
                sugar: item.noCustomisation ? null : isBubbleTeaCustom ? sugar : isMilkshakeCustom ? null : toLabel("sugar", sugar),
                ice: item.noCustomisation ? null : isBubbleTeaCustom ? ice : null,
                syrups: item.noCustomisation || isBubbleTeaCustom || isMilkshakeCustom ? [] : syrups.map((id) => toLabel("syrups", id)),
                extras: item.noCustomisation
                  ? []
                  : isBubbleTeaCustom || isMilkshakeCustom
                    ? extras.map((id) => BUBBLE_TEA_TOPPINGS.options.find((x) => x.id === id)?.label).filter(Boolean)
                    : extras.map((id) => toLabel("extras", id)),
                qty,
                unitPrice,
                total: lineTotal
              })
            }
            type="button"
          >
            Add to cart — {formatMoney(lineTotal)}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
    </div>
  )
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: "7px 12px",
        background: active ? "var(--terra)" : "white",
        color: active ? "white" : "var(--ink)",
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  )
}
