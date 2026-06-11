import type { CompanySeed } from './types'

/**
 * The coverage universe. Fundamentals here are SEED PARAMETERS for the
 * deterministic simulation engine — they are calibrated to be plausible in
 * scale but every statement, price and quote in the terminal is synthetic.
 */
export const UNIVERSE: CompanySeed[] = [
  {
    ticker: 'AAPL', name: 'Apple Inc', sector: 'Technology', industry: 'Consumer Electronics',
    description: 'Designs, manufactures and markets smartphones, personal computers, tablets, wearables and accessories, and sells a growing portfolio of services including the App Store, iCloud, Apple Music and Apple Pay.',
    hq: 'Cupertino, CA', founded: 1976, employees: 164000, ceo: 'Tim Cook', website: 'apple.com',
    baseRevenue: 365800, revGrowth: 0.045, grossMargin: 0.45, opMargin: 0.30, taxRate: 0.16,
    netDebtPctRev: 0.12, capexPctRev: 0.030, beta: 1.20, vol: 0.27, drift: 0.13, startPrice: 132, sharesOut: 15300, dividendYield: 0.005,
  },
  {
    ticker: 'MSFT', name: 'Microsoft Corp', sector: 'Technology', industry: 'Software — Infrastructure',
    description: 'Develops and licenses software, cloud services, devices and solutions worldwide, spanning Azure, Office 365, Windows, LinkedIn, Dynamics and gaming via Xbox and Activision Blizzard.',
    hq: 'Redmond, WA', founded: 1975, employees: 228000, ceo: 'Satya Nadella', website: 'microsoft.com',
    baseRevenue: 168100, revGrowth: 0.115, grossMargin: 0.69, opMargin: 0.42, taxRate: 0.18,
    netDebtPctRev: -0.10, capexPctRev: 0.14, beta: 1.05, vol: 0.24, drift: 0.15, startPrice: 265, sharesOut: 7440, dividendYield: 0.008,
  },
  {
    ticker: 'GOOGL', name: 'Alphabet Inc', sector: 'Communication Services', industry: 'Internet Content & Information',
    description: 'Holding company for Google, operating Search, YouTube, Android, Chrome and Google Cloud, plus Other Bets including Waymo autonomous driving and Verily life sciences.',
    hq: 'Mountain View, CA', founded: 1998, employees: 182000, ceo: 'Sundar Pichai', website: 'abc.xyz',
    baseRevenue: 257600, revGrowth: 0.105, grossMargin: 0.57, opMargin: 0.29, taxRate: 0.15,
    netDebtPctRev: -0.35, capexPctRev: 0.13, beta: 1.10, vol: 0.28, drift: 0.14, startPrice: 120, sharesOut: 12450, dividendYield: 0.004,
  },
  {
    ticker: 'AMZN', name: 'Amazon.com Inc', sector: 'Consumer Discretionary', industry: 'Internet Retail',
    description: 'Operates global online and physical retail, third-party seller services, subscription services, advertising, and Amazon Web Services, the leading cloud infrastructure platform.',
    hq: 'Seattle, WA', founded: 1994, employees: 1550000, ceo: 'Andy Jassy', website: 'amazon.com',
    baseRevenue: 469800, revGrowth: 0.105, grossMargin: 0.46, opMargin: 0.07, taxRate: 0.17,
    netDebtPctRev: 0.08, capexPctRev: 0.12, beta: 1.25, vol: 0.32, drift: 0.13, startPrice: 110, sharesOut: 10500, dividendYield: 0,
  },
  {
    ticker: 'NVDA', name: 'NVIDIA Corp', sector: 'Technology', industry: 'Semiconductors',
    description: 'Designs GPUs and full-stack accelerated computing platforms for data center AI, gaming, professional visualization and automotive, including the CUDA software ecosystem and networking via Mellanox.',
    hq: 'Santa Clara, CA', founded: 1993, employees: 32000, ceo: 'Jensen Huang', website: 'nvidia.com',
    baseRevenue: 26900, revGrowth: 0.55, grossMargin: 0.71, opMargin: 0.50, taxRate: 0.14,
    netDebtPctRev: -0.25, capexPctRev: 0.04, beta: 1.70, vol: 0.48, drift: 0.32, startPrice: 18, sharesOut: 24500, dividendYield: 0.0003,
  },
  {
    ticker: 'META', name: 'Meta Platforms Inc', sector: 'Communication Services', industry: 'Internet Content & Information',
    description: 'Operates Facebook, Instagram, WhatsApp and Messenger, monetized primarily through advertising, and invests in AI infrastructure and the Reality Labs AR/VR segment.',
    hq: 'Menlo Park, CA', founded: 2004, employees: 74000, ceo: 'Mark Zuckerberg', website: 'meta.com',
    baseRevenue: 117900, revGrowth: 0.10, grossMargin: 0.81, opMargin: 0.36, taxRate: 0.16,
    netDebtPctRev: -0.20, capexPctRev: 0.21, beta: 1.30, vol: 0.38, drift: 0.16, startPrice: 200, sharesOut: 2530, dividendYield: 0.004,
  },
  {
    ticker: 'TSLA', name: 'Tesla Inc', sector: 'Consumer Discretionary', industry: 'Auto Manufacturers',
    description: 'Designs, manufactures and sells electric vehicles and energy generation and storage systems, and develops autonomous driving software and humanoid robotics.',
    hq: 'Austin, TX', founded: 2003, employees: 125000, ceo: 'Elon Musk', website: 'tesla.com',
    baseRevenue: 53800, revGrowth: 0.18, grossMargin: 0.20, opMargin: 0.09, taxRate: 0.12,
    netDebtPctRev: -0.22, capexPctRev: 0.13, beta: 1.95, vol: 0.55, drift: 0.10, startPrice: 230, sharesOut: 3190, dividendYield: 0,
  },
  {
    ticker: 'AVGO', name: 'Broadcom Inc', sector: 'Technology', industry: 'Semiconductors',
    description: 'Designs semiconductor devices for networking, broadband, wireless and storage, and provides infrastructure software through CA, Symantec enterprise and VMware.',
    hq: 'Palo Alto, CA', founded: 1961, employees: 37000, ceo: 'Hock Tan', website: 'broadcom.com',
    baseRevenue: 27450, revGrowth: 0.20, grossMargin: 0.63, opMargin: 0.40, taxRate: 0.10,
    netDebtPctRev: 0.95, capexPctRev: 0.02, beta: 1.25, vol: 0.34, drift: 0.22, startPrice: 60, sharesOut: 4650, dividendYield: 0.012,
  },
  {
    ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', industry: 'Semiconductors',
    description: 'Designs CPUs, GPUs and adaptive SoCs for data center, client, gaming and embedded markets, competing in AI accelerators with the Instinct line.',
    hq: 'Santa Clara, CA', founded: 1969, employees: 26000, ceo: 'Lisa Su', website: 'amd.com',
    baseRevenue: 16430, revGrowth: 0.13, grossMargin: 0.49, opMargin: 0.13, taxRate: 0.13,
    netDebtPctRev: -0.12, capexPctRev: 0.03, beta: 1.65, vol: 0.50, drift: 0.07, startPrice: 110, sharesOut: 1620, dividendYield: 0,
  },
  {
    ticker: 'CRM', name: 'Salesforce Inc', sector: 'Technology', industry: 'Software — Application',
    description: 'Provides customer relationship management software and enterprise cloud applications spanning sales, service, marketing, commerce, data (MuleSoft, Tableau) and collaboration (Slack).',
    hq: 'San Francisco, CA', founded: 1999, employees: 73000, ceo: 'Marc Benioff', website: 'salesforce.com',
    baseRevenue: 26490, revGrowth: 0.12, grossMargin: 0.75, opMargin: 0.19, taxRate: 0.20,
    netDebtPctRev: -0.05, capexPctRev: 0.03, beta: 1.30, vol: 0.34, drift: 0.06, startPrice: 230, sharesOut: 970, dividendYield: 0.006,
  },
  {
    ticker: 'JPM', name: 'JPMorgan Chase & Co', sector: 'Financials', industry: 'Banks — Diversified',
    description: 'Global financial services firm operating in consumer and community banking, corporate and investment banking, commercial banking and asset and wealth management.',
    hq: 'New York, NY', founded: 1799, employees: 310000, ceo: 'Jamie Dimon', website: 'jpmorganchase.com',
    baseRevenue: 121650, revGrowth: 0.085, grossMargin: 1.0, opMargin: 0.40, taxRate: 0.20,
    netDebtPctRev: 0.6, capexPctRev: 0.0, beta: 1.10, vol: 0.25, drift: 0.12, startPrice: 150, sharesOut: 2860, dividendYield: 0.022,
  },
  {
    ticker: 'V', name: 'Visa Inc', sector: 'Financials', industry: 'Credit Services',
    description: 'Operates the world’s largest retail electronic payments network, processing transactions among consumers, merchants, financial institutions and governments across more than 200 markets.',
    hq: 'San Francisco, CA', founded: 1958, employees: 28800, ceo: 'Ryan McInerney', website: 'visa.com',
    baseRevenue: 24110, revGrowth: 0.11, grossMargin: 0.80, opMargin: 0.66, taxRate: 0.19,
    netDebtPctRev: 0.15, capexPctRev: 0.04, beta: 0.95, vol: 0.22, drift: 0.11, startPrice: 220, sharesOut: 2030, dividendYield: 0.008,
  },
  {
    ticker: 'GS', name: 'Goldman Sachs Group', sector: 'Financials', industry: 'Capital Markets',
    description: 'Global investment banking, securities and investment management firm serving corporations, financial institutions, governments and individuals.',
    hq: 'New York, NY', founded: 1869, employees: 45000, ceo: 'David Solomon', website: 'goldmansachs.com',
    baseRevenue: 59340, revGrowth: 0.015, grossMargin: 1.0, opMargin: 0.35, taxRate: 0.21,
    netDebtPctRev: 1.0, capexPctRev: 0.0, beta: 1.30, vol: 0.28, drift: 0.10, startPrice: 350, sharesOut: 325, dividendYield: 0.021,
  },
  {
    ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', industry: 'Healthcare Plans',
    description: 'Diversified health care company providing insurance benefits through UnitedHealthcare and health services — pharmacy benefits, care delivery and analytics — through Optum.',
    hq: 'Minnetonka, MN', founded: 1977, employees: 400000, ceo: 'Tim Noel', website: 'unitedhealthgroup.com',
    baseRevenue: 287600, revGrowth: 0.085, grossMargin: 0.24, opMargin: 0.08, taxRate: 0.21,
    netDebtPctRev: 0.13, capexPctRev: 0.01, beta: 0.70, vol: 0.26, drift: 0.05, startPrice: 450, sharesOut: 920, dividendYield: 0.016,
  },
  {
    ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Drug Manufacturers',
    description: 'Researches, develops and sells pharmaceutical products in immunology, oncology, neuroscience and cardiovascular medicine, and medical technologies for surgery, orthopaedics and vision.',
    hq: 'New Brunswick, NJ', founded: 1886, employees: 132000, ceo: 'Joaquin Duato', website: 'jnj.com',
    baseRevenue: 78700, revGrowth: 0.035, grossMargin: 0.69, opMargin: 0.25, taxRate: 0.17,
    netDebtPctRev: 0.10, capexPctRev: 0.05, beta: 0.55, vol: 0.17, drift: 0.05, startPrice: 165, sharesOut: 2410, dividendYield: 0.030,
  },
  {
    ticker: 'LLY', name: 'Eli Lilly & Co', sector: 'Healthcare', industry: 'Drug Manufacturers',
    description: 'Discovers, develops and markets human pharmaceuticals, with leading franchises in diabetes and obesity (Mounjaro, Zepbound), oncology, immunology and neuroscience.',
    hq: 'Indianapolis, IN', founded: 1876, employees: 47000, ceo: 'David Ricks', website: 'lilly.com',
    baseRevenue: 28320, revGrowth: 0.22, grossMargin: 0.79, opMargin: 0.30, taxRate: 0.14,
    netDebtPctRev: 0.45, capexPctRev: 0.09, beta: 0.45, vol: 0.30, drift: 0.24, startPrice: 230, sharesOut: 950, dividendYield: 0.007,
  },
  {
    ticker: 'XOM', name: 'Exxon Mobil Corp', sector: 'Energy', industry: 'Oil & Gas Integrated',
    description: 'Explores for and produces crude oil and natural gas, manufactures petroleum products, and is building low-carbon businesses in carbon capture, hydrogen and lithium.',
    hq: 'Spring, TX', founded: 1870, employees: 61000, ceo: 'Darren Woods', website: 'exxonmobil.com',
    baseRevenue: 285600, revGrowth: 0.045, grossMargin: 0.32, opMargin: 0.14, taxRate: 0.28,
    netDebtPctRev: 0.12, capexPctRev: 0.07, beta: 0.90, vol: 0.27, drift: 0.10, startPrice: 60, sharesOut: 4100, dividendYield: 0.033,
  },
  {
    ticker: 'CVX', name: 'Chevron Corp', sector: 'Energy', industry: 'Oil & Gas Integrated',
    description: 'Integrated energy company engaged in upstream oil and gas exploration and production and downstream refining and marketing, with growing positions in the Permian Basin and Kazakhstan.',
    hq: 'Houston, TX', founded: 1879, employees: 45600, ceo: 'Mike Wirth', website: 'chevron.com',
    baseRevenue: 162470, revGrowth: 0.035, grossMargin: 0.30, opMargin: 0.13, taxRate: 0.27,
    netDebtPctRev: 0.13, capexPctRev: 0.08, beta: 0.95, vol: 0.26, drift: 0.08, startPrice: 105, sharesOut: 1790, dividendYield: 0.041,
  },
  {
    ticker: 'WMT', name: 'Walmart Inc', sector: 'Consumer Staples', industry: 'Discount Stores',
    description: 'Operates retail, wholesale and e-commerce worldwide through Walmart U.S., Walmart International and Sam’s Club, with fast-growing advertising and marketplace businesses.',
    hq: 'Bentonville, AR', founded: 1962, employees: 2100000, ceo: 'Doug McMillon', website: 'walmart.com',
    baseRevenue: 572750, revGrowth: 0.05, grossMargin: 0.25, opMargin: 0.042, taxRate: 0.25,
    netDebtPctRev: 0.09, capexPctRev: 0.025, beta: 0.55, vol: 0.19, drift: 0.13, startPrice: 47, sharesOut: 8030, dividendYield: 0.010,
  },
  {
    ticker: 'COST', name: 'Costco Wholesale Corp', sector: 'Consumer Staples', industry: 'Discount Stores',
    description: 'Operates membership warehouses offering branded and private-label products at low prices, generating most operating profit from a high-renewal membership fee base.',
    hq: 'Issaquah, WA', founded: 1983, employees: 333000, ceo: 'Ron Vachris', website: 'costco.com',
    baseRevenue: 195930, revGrowth: 0.075, grossMargin: 0.125, opMargin: 0.035, taxRate: 0.25,
    netDebtPctRev: -0.02, capexPctRev: 0.022, beta: 0.75, vol: 0.21, drift: 0.16, startPrice: 480, sharesOut: 443, dividendYield: 0.005,
  },
  {
    ticker: 'PG', name: 'Procter & Gamble Co', sector: 'Consumer Staples', industry: 'Household Products',
    description: 'Manufactures and sells branded consumer packaged goods across beauty, grooming, health care, fabric and home care, and baby and family care, including Tide, Pampers and Gillette.',
    hq: 'Cincinnati, OH', founded: 1837, employees: 108000, ceo: 'Jon Moeller', website: 'pg.com',
    baseRevenue: 76120, revGrowth: 0.035, grossMargin: 0.49, opMargin: 0.23, taxRate: 0.19,
    netDebtPctRev: 0.30, capexPctRev: 0.04, beta: 0.45, vol: 0.16, drift: 0.06, startPrice: 138, sharesOut: 2360, dividendYield: 0.024,
  },
  {
    ticker: 'KO', name: 'Coca-Cola Co', sector: 'Consumer Staples', industry: 'Beverages',
    description: 'Manufactures, markets and sells nonalcoholic beverage concentrates and finished beverages including Coca-Cola, Sprite, Fanta, smartwater and Costa Coffee in more than 200 countries.',
    hq: 'Atlanta, GA', founded: 1886, employees: 79100, ceo: 'James Quincey', website: 'coca-colacompany.com',
    baseRevenue: 38660, revGrowth: 0.055, grossMargin: 0.60, opMargin: 0.29, taxRate: 0.19,
    netDebtPctRev: 0.65, capexPctRev: 0.04, beta: 0.55, vol: 0.15, drift: 0.06, startPrice: 55, sharesOut: 4310, dividendYield: 0.030,
  },
  {
    ticker: 'CAT', name: 'Caterpillar Inc', sector: 'Industrials', industry: 'Farm & Heavy Machinery',
    description: 'Manufactures construction and mining equipment, off-highway diesel and natural gas engines, industrial gas turbines and diesel-electric locomotives, with a large financing arm.',
    hq: 'Irving, TX', founded: 1925, employees: 113000, ceo: 'Joe Creed', website: 'caterpillar.com',
    baseRevenue: 50970, revGrowth: 0.055, grossMargin: 0.32, opMargin: 0.17, taxRate: 0.23,
    netDebtPctRev: 0.55, capexPctRev: 0.05, beta: 1.10, vol: 0.26, drift: 0.13, startPrice: 200, sharesOut: 485, dividendYield: 0.016,
  },
  {
    ticker: 'BA', name: 'Boeing Co', sector: 'Industrials', industry: 'Aerospace & Defense',
    description: 'Designs, manufactures and services commercial jetliners, defense products and space systems, and provides aftermarket support through Boeing Global Services.',
    hq: 'Arlington, VA', founded: 1916, employees: 170000, ceo: 'Kelly Ortberg', website: 'boeing.com',
    baseRevenue: 62290, revGrowth: 0.045, grossMargin: 0.10, opMargin: -0.03, taxRate: 0.10,
    netDebtPctRev: 0.65, capexPctRev: 0.025, beta: 1.45, vol: 0.38, drift: 0.01, startPrice: 215, sharesOut: 615, dividendYield: 0,
  },
]

export const SECTORS = [...new Set(UNIVERSE.map((c) => c.sector))].sort()
