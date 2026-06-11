import { FUNCTIONS } from '../state/registry'
import { useTerminal } from '../state/TerminalContext'
import { Panel } from '../components/Panel'

/** HELP — function directory, command grammar and keyboard map. */
export default function HELP() {
  const { execute } = useTerminal()
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 auto-rows-min">
      <Panel title="Function Directory">
        <table className="w-full text-xs">
          <thead className="bg-panelhead">
            <tr className="text-zinc-500 border-b border-line">
              <th className="text-left px-3 py-1.5 font-normal">CODE</th>
              <th className="text-left px-3 py-1.5 font-normal">ALIASES</th>
              <th className="text-left px-3 py-1.5 font-normal">SCREEN</th>
              <th className="text-left px-3 py-1.5 font-normal">KEY</th>
            </tr>
          </thead>
          <tbody>
            {FUNCTIONS.map((f) => (
              <tr
                key={f.code}
                className="border-b border-line/40 hover:bg-white/[0.04] cursor-pointer"
                onClick={() => execute(f.requiresSecurity ? `AAPL ${f.code}` : f.code)}
              >
                <td className="px-3 py-1.5 text-amber font-bold">{f.code}</td>
                <td className="px-3 py-1.5 text-zinc-500">{f.aliases.join(', ')}</td>
                <td className="px-3 py-1.5 text-zinc-300">
                  {f.name}
                  <span className="text-zinc-600"> — {f.description}</span>
                  {f.requiresSecurity && <span className="text-cyan-300/70"> (security)</span>}
                </td>
                <td className="px-3 py-1.5 text-zinc-500">{f.fkey ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="flex flex-col gap-2">
        <Panel title="Command Grammar">
          <div className="p-3 text-xs text-zinc-400 space-y-2 leading-relaxed">
            <p>
              Everything is driven from the command line at the top. Press{' '}
              <kbd className="text-amber border border-zinc-700 px-1 rounded">/</kbd> or{' '}
              <kbd className="text-amber border border-zinc-700 px-1 rounded">Ctrl+K</kbd> to focus it, then type:
            </p>
            <table className="w-full">
              <tbody>
                {[
                  ['NVDA', 'Load NVIDIA into the current security screen'],
                  ['NVDA DCF', 'Open the DCF model for NVIDIA'],
                  ['DCF', 'Open the DCF model for the active security'],
                  ['SCREEN', 'Open the equity screener (alias of EQS)'],
                  ['apple chart', 'Fuzzy matching works on names and plain English'],
                ].map(([cmd, desc]) => (
                  <tr key={cmd} className="border-b border-line/30">
                    <td className="py-1 pr-4 text-amber font-bold whitespace-nowrap">› {cmd}</td>
                    <td className="py-1 text-zinc-400">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              <kbd className="text-amber border border-zinc-700 px-1 rounded">Tab</kbd> autocompletes,{' '}
              <kbd className="text-amber border border-zinc-700 px-1 rounded">↑↓</kbd> navigate suggestions,{' '}
              <kbd className="text-amber border border-zinc-700 px-1 rounded">F1–F8</kbd> jump to screens,{' '}
              <kbd className="text-amber border border-zinc-700 px-1 rounded">Alt+←</kbd> goes back.
            </p>
          </div>
        </Panel>

        <Panel title="About ATLAS Terminal">
          <div className="p-3 text-xs text-zinc-400 space-y-2 leading-relaxed">
            <p>
              ATLAS keeps what makes a pro terminal fast — a command-driven workflow, dense
              single-screen layouts, and every analytic two keystrokes away — and drops what makes
              one painful: no proprietary hardware, no $25K/year seat license, no memorize-or-die
              command codes (autocomplete and plain English both work), modern charting, and
              one-click CSV export from every table instead of a closed ecosystem.
            </p>
            <p className="text-warn">
              ⚠ All market data, financial statements and news in this build are produced by a
              deterministic simulation engine for demonstration and education. Numbers are
              plausible in scale but are not real quotes or filings — do not trade on them. The
              data layer is isolated in <code className="text-zinc-300">src/data/engine.ts</code>{' '}
              so a licensed market-data adapter can be dropped in without touching any screen.
            </p>
            <p>
              Analytics included: DCF with CAPM/WACC build-up and sensitivity grids, comparable
              company multiples with implied-value bridge, a 4-factor scoring model, technical
              studies (SMA/EMA/RSI/MACD/Bollinger/ATR), historical VaR &amp; CVaR, Sharpe/Sortino,
              beta/alpha regression, correlation matrices, GBM Monte Carlo and Black–Scholes with
              full greeks.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
