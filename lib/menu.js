export const CATEGORIES = {
  hot: {
    id: "hot",
    label: "Hot Coffee",
    desc: "15 items · Made fresh to order",
    soon: false
  },
  iced: {
    id: "iced",
    label: "Iced Coffee",
    desc: "6 items · Cold & refreshing",
    soon: false
  },
  bubble: {
    id: "bubble",
    label: "Bubble Tea",
    desc: "12 items · Custom sugar, ice and toppings",
    soon: false
  },
  shakes: {
    id: "shakes",
    label: "Milkshakes",
    desc: "7 items · Milk choice and toppings",
    soon: false
  },
  food: {
    id: "food",
    label: "Food",
    desc: "Chatpata Lane specials and snacks",
    soon: false
  },
  desserts: {
    id: "desserts",
    label: "Pastries (Eggless & Vegetarian)",
    desc: "Freshly made, 100% vegetarian pastries · $6 each",
    soon: false
  }
}

export const MENU = {
  hot: [
    { id: "cap", name: "Cappuccino", note: "Espresso with velvety steamed milk", small: 4.5, regular: 5 },
    { id: "lat", name: "Latte", note: "Smooth espresso & silky milk", small: 4.5, regular: 5 },
    { id: "fw", name: "Flat White", note: "Ristretto with textured milk", small: 4.5, regular: 5 },
    { id: "lmac", name: "Long Macchiato", note: "Double shot with a dash of milk", regular: 5 },
    { id: "mag", name: "Magic", note: "3/4 ristretto with steamed milk", small: 4.8 },
    { id: "hc", name: "Hot Chocolate", note: "Rich cocoa, warm & velvety", small: 4.5, regular: 5 },
    { id: "lb", name: "Long Black", note: "Espresso over hot water", small: 4.5, regular: 5 },
    { id: "moc", name: "Mocha", note: "Espresso, chocolate & steamed milk", small: 5, regular: 5.5 },
    { id: "chai", name: "Chai Latte", note: "Spiced chai with steamed milk", small: 5, regular: 5.5 },
    { id: "dch", name: "Dirty Chai Latte", note: "Chai with a shot of espresso", small: 5, regular: 5.5 },
    { id: "mat", name: "Matcha Latte", note: "Ceremonial grade matcha & steamed milk", small: 5, regular: 5.5 },
    { id: "sb", name: "Short Black 4oz", note: "Classic espresso shot", regular: 4 },
    { id: "smac", name: "Short Macchiato 4oz", note: "Espresso with a milk dot", regular: 4.5 },
    { id: "pic", name: "Piccolo 4oz", note: "Ristretto with warm milk", regular: 4.5 },
    { id: "bab", name: "Babychino 4oz", note: "Warm steamed milk for little ones", regular: 2.5, noCustomisation: true }
  ],
  iced: [
    { id: "il", name: "Iced Latte", note: "Espresso over cold milk & ice", regular: 6.5 },
    { id: "ic", name: "Iced Chai", note: "Spiced chai served iced", regular: 6.5 },
    { id: "idc", name: "Iced Dirty Chai", note: "Iced chai with a shot of espresso", regular: 6.5 },
    { id: "icv", name: "Iced Coffee + Vanilla Ice Cream", note: "Cold brew with a generous scoop", regular: 7 },
    { id: "ichv", name: "Iced Choc + Vanilla Ice Cream", note: "Iced chocolate indulgence", regular: 7 },
    { id: "imv", name: "Iced Mocha + Vanilla Ice Cream", note: "Mocha meets ice cream", regular: 7 }
  ],
  bubble: [
    {
      id: "bt-pearl-milk-tea",
      name: "Pearl Milk Tea",
      note: "Classic black milk tea with chewy pearls",
      regular: 7.5,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-original-milk-tea",
      name: "Original Milk Tea",
      note: "Smooth and creamy classic milk tea",
      regular: 6.9,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-super-milk-tea",
      name: "Super Milk Tea",
      note: "A richer and bolder milk tea blend",
      regular: 7.5,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-taro-milk-with-pearls",
      name: "Taro Milk with Pearls",
      note: "Creamy taro milk drink with pearls",
      regular: 8.9,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-taro-milk-tea-with-pearls",
      name: "Taro Milk Tea with Pearls",
      note: "Taro infused milk tea with chewy pearls",
      regular: 8.9,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-matcha-magic",
      name: "Matcha Magic",
      note: "Earthy matcha tea with a creamy finish",
      regular: 8.2,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-matcha-crush",
      name: "Matcha Crush",
      note: "Refreshing matcha-forward bubble tea",
      regular: 8.2,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-dirtea",
      name: "Dirtea",
      note: "Signature house blend with bold tea notes",
      regular: 8.2,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-super-dirtea",
      name: "Super Dirtea",
      note: "Enhanced Dirtea with extra richness",
      regular: 8.2,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-strawberry-dirtea",
      name: "Strawberry Dirtea",
      note: "Dirtea blended with strawberry sweetness",
      regular: 8.2,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-mango-dirtea",
      name: "Mango Dirtea",
      note: "Dirtea blended with tropical mango notes",
      regular: 8.2,
      customisationType: "bubble-tea"
    },
    {
      id: "bt-yummy-milk",
      name: "Yummy Milk",
      note: "Creamy sweet milk tea favorite",
      regular: 8.2,
      customisationType: "bubble-tea"
    }
  ],
  shakes: [
    { id: "ms-honeycomb-heaven", name: "Honeycomb Heaven", note: "Creamy honeycomb milkshake", regular: 7.95, customisationType: "milkshake" },
    { id: "ms-vanilla-magic", name: "Vanilla Magic", note: "Classic vanilla milkshake", regular: 7.95, customisationType: "milkshake" },
    { id: "ms-banana-bliss", name: "Banana Bliss", note: "Fresh banana blended milkshake", regular: 7.95, customisationType: "milkshake" },
    { id: "ms-mango-dream", name: "Mango Dream", note: "Tropical mango milkshake", regular: 7.95, customisationType: "milkshake" },
    { id: "ms-chocolate-rush", name: "Chocolate Rush", note: "Rich chocolate milkshake", regular: 7.95, customisationType: "milkshake" },
    { id: "ms-cookies-cream-dream", name: "Cookies & Cream Dream", note: "Cookies and cream milkshake", regular: 7.95, customisationType: "milkshake" },
    { id: "ms-caramel-crave", name: "Caramel Crave", note: "Smooth caramel milkshake", regular: 7.95, customisationType: "milkshake" }
  ],
  desserts: [
    { id: "pas-bf", name: "Black Forest Pastry", note: "Eggless & vegetarian", regular: 6, noCustomisation: true },
    { id: "pas-choc", name: "Chocolate Pastry", note: "Eggless & vegetarian", regular: 6, noCustomisation: true },
    { id: "pas-ras", name: "Rasmalai Pastry", note: "Eggless & vegetarian", regular: 6, noCustomisation: true },
    { id: "pas-pis", name: "Pistachio Pastry", note: "Eggless & vegetarian", regular: 6, noCustomisation: true },
    { id: "pas-man", name: "Mango Pastry", note: "Eggless & vegetarian", regular: 6, noCustomisation: true },
    { id: "pas-pin", name: "Pineapple Pastry", note: "Eggless & vegetarian", regular: 6, noCustomisation: true }
  ],
  food: [
    {
      id: "fd-panipuri",
      group: "Chaat (Street Food Specials)",
      name: "Panipuri (8 pcs)",
      note: "Crispy shells filled with potatoes and chickpeas, served with your choice of flavoured water.",
      regular: 10,
      noCustomisation: true,
      waterOptions: ["Tangy Water", "Spicy Water", "Mix Water"]
    },
    {
      id: "fd-samosa-chaat-1",
      group: "Chaat (Street Food Specials)",
      name: "Samosa Chaat (1 Pc)",
      note: "Crushed samosa topped with chickpeas, yogurt, and chutneys.",
      regular: 10,
      noCustomisation: true,
      spiceOptions: ["Mild", "Medium", "Spicy"]
    },
    {
      id: "fd-samosa-chaat-2",
      group: "Chaat (Street Food Specials)",
      name: "Samosa Chaat (2 Pcs)",
      note: "Crushed samosa topped with chickpeas, yogurt, and chutneys.",
      regular: 15,
      noCustomisation: true,
      spiceOptions: ["Mild", "Medium", "Spicy"]
    },
    {
      id: "fd-kachori-chaat",
      group: "Chaat (Street Food Specials)",
      name: "Kachori Chaat",
      note: "Flaky lentil-filled pastry served with potato curry, yogurt, and chutneys.",
      regular: 12,
      noCustomisation: true,
      spiceOptions: ["Mild", "Medium", "Spicy"]
    },
    {
      id: "fd-dahi-puri",
      group: "Chaat (Street Food Specials)",
      name: "Dahi Puri",
      note: "Crispy puris filled with potatoes, yogurt, and sweet & spicy sauces.",
      regular: 12,
      noCustomisation: true,
      spiceOptions: ["Mild", "Medium", "Spicy"]
    },
    {
      id: "fd-samosa",
      group: "Snacks Menu",
      name: "Samosa (1 Pc)",
      note: "Crispy pastry filled with spiced potatoes and peas.",
      regular: 4,
      noCustomisation: true
    },
    {
      id: "fd-moong-dal-kachori",
      group: "Snacks Menu",
      name: "Moong Dal Kachori (Per Piece)",
      note: "Crispy pastry stuffed with spiced lentils.",
      regular: 4.5,
      noCustomisation: true
    },
    {
      id: "fd-nepali-veg-momo",
      group: "Snacks Menu",
      name: "Nepali Vegetarian Steam Momo (10 Pcs)",
      note: "Steamed dumplings filled with vegetables and paneer.",
      regular: 15.99,
      noCustomisation: true
    },
    {
      id: "fd-nepali-chicken-momo",
      group: "Snacks Menu",
      name: "Nepali Chicken Steam Momo (10 Pcs)",
      note: "Steamed dumplings filled with seasoned chicken.",
      regular: 16.99,
      noCustomisation: true
    },
    {
      id: "fd-veg-puff",
      group: "Snacks Menu",
      name: "Vegetable Puff (Per Piece)",
      note: "Flaky pastry filled with spiced vegetables.",
      regular: 6,
      noCustomisation: true
    },
    {
      id: "fd-cream-roll",
      group: "Snacks Menu",
      name: "Cream Roll (Per Piece)",
      note: "Sweet roll filled with whipped cream.",
      regular: 6,
      noCustomisation: true
    }
  ]
}

export const ADDONS = {
  milk: [
    { id: "full", label: "Full Cream", price: 0 },
    { id: "skinny", label: "Skinny", price: 0 },
    { id: "soy", label: "Soy by Bonsoy", price: 0.6 },
    { id: "almond", label: "Almond by Milklab", price: 0.6 },
    { id: "lactose", label: "Lactose Free", price: 0.6 },
    { id: "oat", label: "Oat Milk", price: 0.6 }
  ],
  sugar: [
    { id: "none", label: "No Sugar", price: 0 },
    { id: "one", label: "1 Spoon", price: 0 },
    { id: "two", label: "2 Spoon", price: 0 },
    { id: "equal", label: "Equal", price: 0 },
    { id: "honey", label: "Honey", price: 0 }
  ],
  syrups: [
    { id: "hazelnut", label: "Hazelnut", price: 0.6 },
    { id: "vanilla", label: "Vanilla", price: 0.6 },
    { id: "caramel", label: "Caramel", price: 0.6 }
  ],
  extras: [
    { id: "shot", label: "Extra Shot", price: 0.6 },
    { id: "decaf", label: "Decaf", price: 0.6 },
    { id: "extra-hot", label: "Extra Hot", price: 0 },
    { id: "weak", label: "Weak", price: 0 }
  ]
}

export const BUBBLE_TEA_CUSTOMIZATION = {
  sugarLevels: ["0%", "25%", "50%", "75%", "100%"],
  iceLevels: ["No Ice", "Little Ice", "Less Ice", "Regular", "Warm", "Hot"]
}

export const BUBBLE_TEA_TOPPINGS = {
  unitPrice: 1,
  options: [
    { id: "pearls", label: "Pearls", price: 1 },
    { id: "red-beans", label: "Red beans", price: 1 },
    { id: "herb-jelly", label: "Herb Jelly", price: 1 },
    { id: "black-sticky-rice", label: "Black Sticky Rice", price: 1 },
    { id: "white-pearls", label: "White Pearls", price: 1 },
    { id: "pudding", label: "Pudding", price: 1 },
    { id: "aloe-vera", label: "Aloe Vera", price: 1 },
    { id: "strawberry-popping", label: "Strawberry Popping", price: 1 },
    { id: "mango-popping", label: "Mango Popping", price: 1 },
    { id: "yogurt-popping", label: "Yogurt Popping", price: 1 },
    { id: "cheesy-mousse", label: "Cheesy Mousse", price: 1 },
    { id: "taro-mousse", label: "Taro Mousse", price: 1 },
    { id: "coconut-jelly", label: "Coconut Jelly", price: 1 }
  ]
}

export const MILKSHAKE_MILK_CHOICES = [
  { id: "ms-full", label: "Full Cream", price: 0 },
  { id: "ms-skinny", label: "Skinny Milk", price: 0 },
  { id: "ms-almond", label: "Milklab Almond", price: 1 },
  { id: "ms-bonsoy", label: "Bonsoy", price: 1 },
  { id: "ms-oat", label: "Alternative Oat", price: 1 },
  { id: "ms-lactose", label: "Lactose Free", price: 1 }
]

export const hasBothSizes = (item) => item.small !== undefined && item.regular !== undefined

export const getBasePrice = (item, size) => {
  if (size === "small" && item.small !== undefined) return item.small
  return item.regular ?? item.small ?? 0
}

export const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`
