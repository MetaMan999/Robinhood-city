export type CorporateCompany = {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  buildingId: string;
  accent: string;
  role: string;
};

export const CORPORATE_COMPANIES: CorporateCompany[] = [
  {
    id: "jpm",
    name: "JPMorgan Chase",
    ticker: "JPM",
    sector: "FINANCE",
    buildingId: "kogane-bank",
    accent: "#82c0ff",
    role: "Operations",
  },
  {
    id: "gs",
    name: "Goldman Sachs",
    ticker: "GS",
    sector: "FINANCE",
    buildingId: "aoi-towers",
    accent: "#6fb7ff",
    role: "Markets",
  },
  {
    id: "v",
    name: "Visa",
    ticker: "V",
    sector: "PAYMENTS",
    buildingId: "city-hall",
    accent: "#f4d35e",
    role: "Network",
  },
  {
    id: "aapl",
    name: "Apple",
    ticker: "AAPL",
    sector: "TECHNOLOGY",
    buildingId: "nami-electronics",
    accent: "#d8e0ea",
    role: "Product",
  },
  {
    id: "msft",
    name: "Microsoft",
    ticker: "MSFT",
    sector: "TECHNOLOGY",
    buildingId: "sora-radio",
    accent: "#67d7e5",
    role: "Cloud Systems",
  },
  {
    id: "nvda",
    name: "Nvidia",
    ticker: "NVDA",
    sector: "SEMICONDUCTORS",
    buildingId: "yamato-steel",
    accent: "#76db57",
    role: "Compute",
  },
  {
    id: "wmt",
    name: "Walmart",
    ticker: "WMT",
    sector: "RETAIL",
    buildingId: "harbor-market",
    accent: "#5caeff",
    role: "Commerce",
  },
  {
    id: "tsla",
    name: "Tesla",
    ticker: "TSLA",
    sector: "AUTOMOTIVE",
    buildingId: "sun-auto",
    accent: "#ff6d6d",
    role: "Manufacturing",
  },
  {
    id: "unh",
    name: "UnitedHealth Group",
    ticker: "UNH",
    sector: "HEALTH CARE",
    buildingId: "kanda-clinic",
    accent: "#65d6a6",
    role: "Health Systems",
  },
  {
    id: "bac",
    name: "Bank of America",
    ticker: "BAC",
    sector: "FINANCE",
    buildingId: "central-station",
    accent: "#ff7070",
    role: "Consumer Banking",
  },
];

export const CORPORATE_ROLES = [
  { level: 0, title: "City Intern", xp: 0, payBonus: 0 },
  { level: 1, title: "Associate", xp: 80, payBonus: 0.08 },
  { level: 2, title: "Manager", xp: 220, payBonus: 0.18 },
  { level: 3, title: "Director", xp: 480, payBonus: 0.32 },
  { level: 4, title: "District Boss", xp: 840, payBonus: 0.5 },
];

export function corporateRole(xp: number) {
  return [...CORPORATE_ROLES].reverse().find((role) => xp >= role.xp) ?? CORPORATE_ROLES[0];
}

