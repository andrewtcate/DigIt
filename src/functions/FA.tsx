import { useMemo, useState } from 'react'
import type { Security } from '../data/types'
import { Panel, PanelButton } from '../components/Panel'
import { fmtMillions, fmtPct, fmtNum, chgClass, downloadCsv } from '../lib/format'

type Tab = 'IS' | 'BS' | 'CF' | 'RATIOS'

interface Row {
  label: string
  values: number[]
  kind: 'money' | 'pct' | 'ratio' | 'eps'
  bold?: boolean
  indent?: boolean
}

function buildRows(security: Security, tab: Tab): Row[] {
  const { income, balance, cashFlow, ratios } = security.financials
  switch (tab) {
    case 'IS':
      return [
        { label: 'Revenue', values: income.map((x) => x.revenue), kind: 'money', bold: true },
        { label: 'Cost of Revenue', values: income.map((x) => -x.costOfRevenue), kind: 'money', indent: true },
        { label: 'Gross Profit', values: income.map((x) => x.grossProfit), kind: 'money', bold: true },
        { label: 'R&D Expense', values: income.map((x) => -x.rdExpense), kind: 'money', indent: true },
        { label: 'SG&A Expense', values: income.map((x) => -x.sgaExpense), kind: 'money', indent: true },
        { label: 'Operating Income', values: income.map((x) => x.operatingIncome), kind: 'money', bold: true },
        { label: 'Interest Expense', values: income.map((x) => -x.interestExpense), kind: 'money', indent: true },
        { label: 'Pretax Income', values: income.map((x) => x.pretaxIncome), kind: 'money' },
        { label: 'Tax Expense', values: income.map((x) => -x.taxExpense), kind: 'money', indent: true },
        { label: 'Net Income', values: income.map((x) => x.netIncome), kind: 'money', bold: true },
        { label: 'EBITDA', values: income.map((x) => x.ebitda), kind: 'money' },
        { label: 'Diluted EPS', values: income.map((x) => x.eps), kind: 'eps', bold: true },
        { label: 'Diluted Shares (M)', values: income.map((x) => x.dilutedShares), kind: 'ratio' },
      ]
    case 'BS':
      return [
        { label: 'Cash & Equivalents', values: balance.map((x) => x.cashAndEquivalents), kind: 'money' },
        { label: 'Short-Term Investments', values: balance.map((x) => x.shortTermInvestments), kind: 'money', indent: true },
        { label: 'Receivables', values: balance.map((x) => x.receivables), kind: 'money', indent: true },
        { label: 'Inventory', values: balance.map((x) => x.inventory), kind: 'money', indent: true },
        { label: 'Total Current Assets', values: balance.map((x) => x.totalCurrentAssets), kind: 'money', bold: true },
        { label: 'PP&E (Net)', values: balance.map((x) => x.ppe), kind: 'money' },
        { label: 'Goodwill & Intangibles', values: balance.map((x) => x.goodwill), kind: 'money' },
        { label: 'Total Assets', values: balance.map((x) => x.totalAssets), kind: 'money', bold: true },
        { label: 'Accounts Payable', values: balance.map((x) => x.accountsPayable), kind: 'money', indent: true },
        { label: 'Short-Term Debt', values: balance.map((x) => x.shortTermDebt), kind: 'money', indent: true },
        { label: 'Total Current Liabilities', values: balance.map((x) => x.totalCurrentLiabilities), kind: 'money', bold: true },
        { label: 'Long-Term Debt', values: balance.map((x) => x.longTermDebt), kind: 'money' },
        { label: 'Total Liabilities', values: balance.map((x) => x.totalLiabilities), kind: 'money', bold: true },
        { label: 'Total Equity', values: balance.map((x) => x.totalEquity), kind: 'money', bold: true },
      ]
    case 'CF':
      return [
        { label: 'Net Income', values: cashFlow.map((x) => x.netIncome), kind: 'money' },
        { label: 'D&A', values: cashFlow.map((x) => x.depreciation), kind: 'money', indent: true },
        { label: 'Stock Compensation', values: cashFlow.map((x) => x.stockComp), kind: 'money', indent: true },
        { label: 'Working Capital Δ', values: cashFlow.map((x) => -x.workingCapitalChange), kind: 'money', indent: true },
        { label: 'Operating Cash Flow', values: cashFlow.map((x) => x.operatingCashFlow), kind: 'money', bold: true },
        { label: 'Capital Expenditures', values: cashFlow.map((x) => -x.capex), kind: 'money', indent: true },
        { label: 'Acquisitions', values: cashFlow.map((x) => -x.acquisitions), kind: 'money', indent: true },
        { label: 'Investing Cash Flow', values: cashFlow.map((x) => x.investingCashFlow), kind: 'money', bold: true },
        { label: 'Dividends Paid', values: cashFlow.map((x) => -x.dividendsPaid), kind: 'money', indent: true },
        { label: 'Share Buybacks', values: cashFlow.map((x) => -x.buybacks), kind: 'money', indent: true },
        { label: 'Debt Issued (Net)', values: cashFlow.map((x) => x.debtIssued), kind: 'money', indent: true },
        { label: 'Financing Cash Flow', values: cashFlow.map((x) => x.financingCashFlow), kind: 'money', bold: true },
        { label: 'Free Cash Flow', values: cashFlow.map((x) => x.freeCashFlow), kind: 'money', bold: true },
      ]
    case 'RATIOS':
      return [
        { label: 'Revenue Growth', values: ratios.map((x) => x.revenueGrowth), kind: 'pct', bold: true },
        { label: 'EPS Growth', values: ratios.map((x) => x.epsGrowth), kind: 'pct' },
        { label: 'Gross Margin', values: ratios.map((x) => x.grossMargin), kind: 'pct' },
        { label: 'Operating Margin', values: ratios.map((x) => x.operatingMargin), kind: 'pct' },
        { label: 'EBITDA Margin', values: ratios.map((x) => x.ebitdaMargin), kind: 'pct' },
        { label: 'Net Margin', values: ratios.map((x) => x.netMargin), kind: 'pct' },
        { label: 'FCF Margin', values: ratios.map((x) => x.fcfMargin), kind: 'pct' },
        { label: 'ROE', values: ratios.map((x) => x.roe), kind: 'pct', bold: true },
        { label: 'ROA', values: ratios.map((x) => x.roa), kind: 'pct' },
        { label: 'ROIC', values: ratios.map((x) => x.roic), kind: 'pct', bold: true },
        { label: 'Current Ratio', values: ratios.map((x) => x.currentRatio), kind: 'ratio' },
        { label: 'Quick Ratio', values: ratios.map((x) => x.quickRatio), kind: 'ratio' },
        { label: 'Debt / Equity', values: ratios.map((x) => x.debtToEquity), kind: 'ratio' },
        { label: 'Net Debt / EBITDA', values: ratios.map((x) => x.netDebtToEbitda), kind: 'ratio' },
        { label: 'Interest Coverage', values: ratios.map((x) => x.interestCoverage), kind: 'ratio' },
        { label: 'Asset Turnover', values: ratios.map((x) => x.assetTurnover), kind: 'ratio' },
        { label: 'FCF Conversion', values: ratios.map((x) => x.fcfConversion), kind: 'ratio' },
      ]
  }
}

function fmtCell(v: number, kind: Row['kind']): string {
  switch (kind) {
    case 'money': return fmtMillions(v)
    case 'pct': return fmtPct(v, 1)
    case 'eps': return fmtNum(v, 2)
    case 'ratio': return fmtNum(v, 2)
  }
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'IS', label: 'INCOME' },
  { id: 'BS', label: 'BALANCE' },
  { id: 'CF', label: 'CASH FLOW' },
  { id: 'RATIOS', label: 'RATIOS' },
]

/** FA — five-year statements with YoY deltas, trend bars and CSV export. */
export default function FA({ security }: { security: Security }) {
  const [tab, setTab] = useState<Tab>('IS')
  const rows = useMemo(() => buildRows(security, tab), [security, tab])
  const years = security.financials.income.map((x) => x.fiscalYear)

  const exportCsv = () => {
    const header = ['Line Item', ...years.map((y) => `FY${y}`)]
    const body = rows.map((r) => [r.label, ...r.values.map((v) => v.toFixed(2))])
    downloadCsv(`${security.seed.ticker}_${tab}.csv`, [header, ...body])
  }

  return (
    <Panel
      title={`${security.seed.ticker} — Financial Analysis (values in USD millions, fiscal years)`}
      className="h-full"
      right={
        <div className="flex gap-1">
          {TABS.map((t) => (
            <PanelButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </PanelButton>
          ))}
          <span className="w-2" />
          <PanelButton onClick={exportCsv}>⬇ CSV</PanelButton>
        </div>
      }
    >
      <table className="w-full text-xs tabular-nums">
        <thead className="sticky top-0 bg-panelhead">
          <tr className="text-zinc-500 border-b border-line">
            <th className="text-left px-3 py-1.5 font-normal">LINE ITEM</th>
            {years.map((y) => (
              <th key={y} className="text-right px-3 py-1.5 font-normal">FY{y}</th>
            ))}
            <th className="text-right px-3 py-1.5 font-normal">YoY Δ</th>
            <th className="text-left px-3 py-1.5 font-normal w-24">TREND</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const n = r.values.length
            const last = r.values[n - 1]
            const prev = r.values[n - 2]
            const yoy = prev !== 0 ? (last - prev) / Math.abs(prev) : NaN
            const min = Math.min(...r.values)
            const max = Math.max(...r.values)
            const span = max - min || 1
            return (
              <tr key={r.label} className={`border-b border-line/40 hover:bg-white/[0.03] ${r.bold ? 'bg-white/[0.03]' : ''}`}>
                <td className={`px-3 py-1 ${r.indent ? 'pl-7' : ''} ${r.bold ? 'text-zinc-100 font-bold' : 'text-zinc-400'}`}>
                  {r.label}
                </td>
                {r.values.map((v, i) => (
                  <td key={i} className={`text-right px-3 py-1 ${r.bold ? 'text-zinc-100 font-semibold' : 'text-zinc-300'} ${v < 0 ? 'text-down/90' : ''}`}>
                    {fmtCell(v, r.kind)}
                  </td>
                ))}
                <td className={`text-right px-3 py-1 ${chgClass(yoy)}`}>{fmtPct(yoy, 1, true)}</td>
                <td className="px-3 py-1">
                  <svg width="80" height="14" aria-hidden>
                    {r.values.map((v, i) => {
                      const h = Math.max(((v - min) / span) * 12, 1.5)
                      return (
                        <rect
                          key={i}
                          x={i * 16}
                          y={13 - h}
                          width={11}
                          height={h}
                          fill={i === n - 1 ? '#ffb000' : '#3f4856'}
                        />
                      )
                    })}
                  </svg>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Panel>
  )
}
