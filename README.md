# FareScout ✈️

Open the app and instantly see a **ranked list of the cheapest, most appealing
international flights** — no forms, no setup. FareScout makes smart assumptions,
shows results first, and treats every setting as optional fine-tuning. It ranks
on **total out-of-pocket cost**, intelligently combining **cash and credit-card /
airline points**.

![stack](https://img.shields.io/badge/stack-React%2019%20·%20TypeScript%20·%20Vite%20·%20Tailwind-2563eb)

## What you see

The homepage **is** the ranking. Each card shows:

- **Destination + route + dates + trip length**
- **Departure airport**, with drive time when it isn't your home airport
- **Total cash price** (cheapest realistic option across your nearby airports)
- **"Unusually cheap" flag** — compared to the route's learned/typical baseline
- A **separate premium-cabin flag** for abnormally low business fares (mistake
  fares, sales, award sweet spots)
- The **optimal redemption** — ready-now with points you hold, or aspirational

Toggle between the two decisions, which never blur together:

- **Book today with what I have** — ranks by the cash you'd actually pay today.
- **Best deal if I acquire points** — surfaces the best possible redemption even
  when it needs a program you don't hold, with the exact gap and how to close it.

## Decisions (as asked in the brief)

### Flight pricing API → **Amadeus Self-Service**

Compared Amadeus, Kiwi/Tequila, Skyscanner and Duffel. **Amadeus Self-Service**
is the best fit for a ranked, multi-destination cheap-fare homepage:

| API | Verdict |
|---|---|
| **Amadeus Self-Service** ✅ | Purpose-built endpoints: **Flight Inspiration Search** (cheapest destinations from an origin = the ranking), **Flight Offers Search** (priced itineraries), **Flight Cheapest Date Search** (date flexibility). Real free self-service tier, simple OAuth2. |
| Kiwi / Tequila | Great cheap-fare data, but the API is now partner-gated and hard to obtain self-serve. |
| Skyscanner | Partner-only; keys are not generally available. |
| Duffel | Excellent for **booking** (NDC, real-time order flow), not for cheap-fare *discovery* across many destinations. |

**API keys you provide** (optional — see below): a free Amadeus Self-Service
**API Key** + **API Secret**. Copy `.env.example` → `.env`:

```
VITE_AMADEUS_CLIENT_ID=your_key
VITE_AMADEUS_CLIENT_SECRET=your_secret
VITE_AMADEUS_ENV=test            # or production
VITE_AMADEUS_PROXY=              # see CORS note below
```

> **Works with zero keys.** With no credentials set, FareScout runs on a
> deterministic **offline data engine** that produces realistic, stable-per-day
> fares — the ranking, baseline learning and points optimization are all fully
> functional for demo/dev. Provide keys to switch to live Amadeus data.

> **Browser CORS note:** Amadeus does not send CORS headers, so a browser can't
> call it directly in production. Run a thin proxy / serverless function that
> injects the credentials and forwards to Amadeus, then set `VITE_AMADEUS_PROXY`
> to it. The adapter (`src/lib/amadeus.ts`) targets the proxy when provided.

### Airport inference → **geographic, works for any city**

No airport picking required. From your home city we:

1. **Geocode** it against a bundled major-city gazetteer (`src/data/cities.ts`).
2. Compute **great-circle distance** (haversine) to every airport
   (`src/data/airports.ts`).
3. Convert distance to a **drive-time estimate** (road-circuity factor + average
   speed + fixed overhead) in `src/lib/geo.ts`.
4. Suggest the **nearest airport as "home"** plus every airport within the drive
   radius (default ~2.5 hrs), nearest first. All editable in the panel.

Reproduces the brief's examples:

- **Tampa, FL** → TPA (home), PIE, MCO (+ RSW). *MIA/FLL are genuine ~4.5-hr
  drives — beyond the default radius, but one slider-drag away.*
- **Washington, DC** → DCA (home), IAD, BWI.

We assume you'll connect through major hubs anywhere unless you narrow it down.

### "Unusually cheap" detection → **self-learned baselines**

Cheap-fare APIs don't expose a route's "normal" price, so FareScout **learns its
own baseline**: every scan it records the best price per destination+cabin to
`localStorage` and flags fares that fall well below the learned median
(`src/lib/baseline.ts`). Until enough history accumulates it falls back to a
curated **typical-price seed** — the best available signal when history is
constrained, per the brief. **The more you open the app, the smarter the flags
get.** Premium-cabin fares use a separate, tighter threshold.

### Points + cash optimization

`src/lib/points.ts` computes, for every fare, the combination of points + cash
that minimizes out-of-pocket cost — direct airline holdings **and** bank-point
transfers — then recommends exact steps, e.g. *"Transfer 75k Amex MR → ANA, book
the economy award, pay $180."* For aspirational deals it shows the gap
explicitly (*"You have 12k, needs 60k — short 48k"*) and the fastest way to close
it, prioritizing **signup bonuses**.

Transfer partners, ratios, point valuations and signup bonuses are an **editable
config**: `src/data/transferPartners.ts` (Amex, Chase, Capital One, Citi, Bilt
and their airline partners). Award sweet spots per destination live in
`src/data/destinations.ts`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run lint
```

## Project layout

```
src/
  data/        airports, cities (geocoder), destinations, transferPartners (config)
  lib/         geo (inference), provider/amadeus/mockEngine (fares),
               baseline (deal detection), points (optimizer), format, storage
  state/       settings store + context, useDeals (scan → ranked deals)
  components/  DealCard, RefinementPanel, ModeToggle, HomeCity, Badge
  App.tsx      dashboard shell
```

## Build order shipped

1. ✅ Home-city → departure-airport inference + zero-config landing ranking
2. ✅ Flight provider integration (Amadeus adapter) + multi-destination scan
3. ✅ Baseline learning + "unusually cheap" / premium-cabin flagging
4. ✅ Points + cash optimization with editable transfer-partner config
5. ✅ Aspirational points layer + "have now" vs. "acquire points" toggle
6. ✅ Optional refinement panel (collapsed by default)
