# Public Debt Sustainability Analyser

An interactive IMF-style Debt Sustainability Analysis (DSA) tool for Nigeria. Model the country's debt-to-GDP trajectory under custom macroeconomic assumptions and visualise three-scenario fan-chart projections through 2029.

## What It Does

- Loads Nigeria historical debt actuals (2019–2024) from DMO and NBS data
- Runs the IMF DSA accumulation identity: **d(t) = [(1+r)/(1+g)] × d(t−1) − pb(t)** with an FX stock-flow adjustment for naira-denominated external debt
- Generates optimistic, baseline, and pessimistic scenario paths simultaneously
- Plots an interactive fan chart (Recharts) with IMF threshold reference lines
- Displays four live metric cards: Debt/GDP, Interest/Revenue, Primary Balance, Overall DSA Assessment
- Benchmarks results against IMF emerging market thresholds (55% moderate, 70% high risk)

## Interactive Controls

| Parameter | Range | Description |
|---|---|---|
| Real GDP Growth | −2% to 8% | Nominal growth assumption |
| Nominal Interest Rate | 4% to 18% | Weighted avg rate on new borrowing |
| Primary Balance | −6% to +2% GDP | Revenue minus non-interest spending |
| Oil Revenue Boost | −3 to +5pp/yr | Annual change in oil revenue as % GDP |
| FX Debt Share | 10% to 60% | Share of debt in foreign currency |
| Annual FX Depreciation | 0% to 30% | Naira weakening impact on FX debt stock |

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Recharts** — ComposedChart with Area bands and Line overlays
- **Tailwind CSS**
- All computation runs client-side — no backend required

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Data Sources

- Nigeria DMO Debt Management Office — public debt stock data
- NBS National Bureau of Statistics — GDP figures
- IMF Debt Sustainability Framework — threshold benchmarks

---

Built by [Muhammed Adediran](https://adediran.xyz/contact)
