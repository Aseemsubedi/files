import { createContext, useContext, useMemo, useState } from "react"

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())

  const addItem = (item) => {
    setItems((prev) => [...prev, item])
    setSelectedIds((prev) => new Set([...prev, item.id]))
  }

  const removeItem = (uid) => {
    setItems((prev) => {
      const target = prev.find((i) => i.uid === uid)
      const rest = prev.filter((i) => i.uid !== uid)
      if (target && !rest.some((i) => i.id === target.id)) {
        setSelectedIds((cur) => {
          const next = new Set(cur)
          next.delete(target.id)
          return next
        })
      }
      return rest
    })
  }

  const updateQty = (uid, qty) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item
        const nextQty = Math.max(1, qty)
        return { ...item, qty: nextQty, total: item.unitPrice * nextQty }
      })
    )
  }

  const clearCart = () => {
    setItems([])
    setSelectedIds(new Set())
  }

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [items]
  )

  const value = {
    items,
    selectedIds,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    subtotal
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider")
  }
  return ctx
}
