export type Company = {
  name: string;
  ticker: string;
  sector: string;
  score: number;
  image: string;
  thesis: string;
  href: string;
  updated: string;
  metrics: [number, number, number, number];
};

export const companies: Company[] = [
  {
    name: "Kingsmen Creatives",
    ticker: "SGX: 5MZ",
    sector: "Experiential",
    score: 78,
    image: "/mockup/media/strategy-visitors.jpg",
    thesis: "A regional experience-design platform with improving margins and an expanding attractions pipeline.",
    href: "/kingsmen-creatives.html",
    updated: "12 Sep 2026",
    metrics: [76, 84, 79, 70],
  },
  {
    name: "Straco Corporation",
    ticker: "SGX: S85",
    sector: "Attractions",
    score: 72,
    image: "/mockup/media/straco-flyer-skyline.webp",
    thesis: "Durable attraction economics and balance-sheet strength, tempered by concentrated assets.",
    href: "/straco-corporation.html",
    updated: "08 Sep 2026",
    metrics: [88, 74, 58, 68],
  },
  {
    name: "mm2 Asia",
    ticker: "SGX: 1B0",
    sector: "Film & Media",
    score: 68,
    image: "/mockup/media/exm-krisflyer.jpg",
    thesis: "A connected content platform whose recovery rests on debt discipline and monetising its rights library.",
    href: "#company-gallery",
    updated: "04 Sep 2026",
    metrics: [57, 76, 71, 64],
  },
  {
    name: "UnUsUaL Limited",
    ticker: "SGX: 1D1",
    sector: "Live Events",
    score: 71,
    image: "/mockup/media/eta-expo-pavilion.jpg",
    thesis: "A proven live-entertainment operator with regional scale and inherently lumpy event economics.",
    href: "#company-gallery",
    updated: "29 Aug 2026",
    metrics: [72, 80, 75, 57],
  },
  {
    name: "G.H.Y Culture & Media",
    ticker: "SGX: XJB",
    sector: "Film & Media",
    score: 65,
    image: "/mockup/media/rd-bicentennial.jpg",
    thesis: "A cross-border cultural producer with valuable capabilities, but uneven project visibility.",
    href: "#company-gallery",
    updated: "21 Aug 2026",
    metrics: [61, 70, 69, 59],
  },
  {
    name: "NoonTalk Media",
    ticker: "SGX: SEJ",
    sector: "Film & Media",
    score: 62,
    image: "/mockup/media/rci-singtel.jpg",
    thesis: "An emerging talent and production network with optionality, limited today by its smaller earnings base.",
    href: "#company-gallery",
    updated: "15 Aug 2026",
    metrics: [54, 64, 72, 58],
  },
];

export const scoreCategories = [
  {
    name: "Financial Strength",
    weight: 30,
    description: "Earnings quality, cash conversion, balance-sheet resilience and returns on capital.",
    metrics: ["Cash conversion", "Margin quality", "Leverage", "Capital returns"],
  },
  {
    name: "Market Position",
    weight: 25,
    description: "Competitive advantage, customer relevance, pricing power and market structure.",
    metrics: ["Brand relevance", "Customer concentration", "Pricing power", "Competitive intensity"],
  },
  {
    name: "Growth Potential",
    weight: 25,
    description: "Visible demand, reinvestment runway, sector tailwinds and strategic execution.",
    metrics: ["Order visibility", "Addressable market", "Capacity to invest", "Execution record"],
  },
  {
    name: "Risk & Resilience",
    weight: 20,
    description: "Downside exposure, cyclicality, governance and the capacity to absorb shocks.",
    metrics: ["Cyclicality", "Governance", "Key-person risk", "Downside protection"],
  },
];
