import { TerminalProvider, useTerminal } from './state/TerminalContext'
import { getSecurity } from './data/engine'
import { resolveFunction } from './state/registry'
import CommandBar from './components/CommandBar'
import Watchlist from './components/Watchlist'
import QuoteHeader from './components/QuoteHeader'
import StatusBar from './components/StatusBar'
import MOST from './functions/MOST'
import DES from './functions/DES'
import GP from './functions/GP'
import FA from './functions/FA'
import DCF from './functions/DCF'
import COMP from './functions/COMP'
import EQS from './functions/EQS'
import PORT from './functions/PORT'
import MC from './functions/MC'
import OVM from './functions/OVM'
import NEWS from './functions/NEWS'
import HELP from './functions/HELP'

function Screen() {
  const { view } = useTerminal()
  const fn = resolveFunction(view.func)
  const security = view.ticker ? getSecurity(view.ticker) : undefined

  if (fn?.requiresSecurity && !security) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
        Load a security first — e.g. type <span className="text-amber mx-1 font-bold">AAPL</span> in the command line.
      </div>
    )
  }

  const body = (() => {
    switch (fn?.code) {
      case 'MOST': return <MOST />
      case 'DES': return <DES security={security!} />
      case 'GP': return <GP security={security!} />
      case 'FA': return <FA security={security!} />
      case 'DCF': return <DCF security={security!} />
      case 'COMP': return <COMP security={security!} />
      case 'EQS': return <EQS />
      case 'PORT': return <PORT />
      case 'MC': return <MC security={security!} />
      case 'OVM': return <OVM security={security!} />
      case 'N': return <NEWS ticker={view.ticker} />
      case 'HELP': return <HELP />
      default: return <MOST />
    }
  })()

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      {fn?.requiresSecurity && security && <QuoteHeader security={security} />}
      <div className="flex-1 min-h-0 overflow-auto">{body}</div>
    </div>
  )
}

function Shell() {
  return (
    <div className="h-screen flex flex-col bg-bg text-zinc-200 font-mono text-sm overflow-hidden">
      <header className="flex items-center gap-3 px-3 h-11 border-b border-line bg-black shrink-0">
        <div className="flex items-baseline gap-1 select-none">
          <span className="text-amber font-black tracking-[0.2em] text-base">ATLAS</span>
          <span className="text-zinc-500 text-[10px] tracking-widest">TERMINAL</span>
        </div>
        <CommandBar />
        <div className="ml-auto hidden md:block text-[10px] text-zinc-600 tracking-wider">
          EQUITY ANALYTICS WORKSTATION
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <Watchlist />
        <main className="flex-1 min-w-0 min-h-0 p-2 overflow-auto">
          <Screen />
        </main>
      </div>
      <StatusBar />
    </div>
  )
}

export default function App() {
  return (
    <TerminalProvider>
      <Shell />
    </TerminalProvider>
  )
}
