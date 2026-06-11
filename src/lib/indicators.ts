/** Technical indicators. All functions return arrays aligned to the input
 * (leading values are NaN until the indicator has enough history). */

export function sma(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

export function ema(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN)
  if (values.length < period) return out
  const k = 2 / (period + 1)
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  out[period - 1] = prev
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

export function rsi(closes: number[], period = 14): number[] {
  const out = new Array<number>(closes.length).fill(NaN)
  if (closes.length <= period) return out
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const chg = closes[i] - closes[i - 1]
    if (chg > 0) avgGain += chg
    else avgLoss -= chg
  }
  avgGain /= period
  avgLoss /= period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  for (let i = period + 1; i < closes.length; i++) {
    const chg = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(chg, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-chg, 0)) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

export interface MacdResult {
  macd: number[]
  signal: number[]
  histogram: number[]
}

export function macd(closes: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const emaFast = ema(closes, fast)
  const emaSlow = ema(closes, slow)
  const macdLine = closes.map((_, i) => emaFast[i] - emaSlow[i])
  // Signal EMA computed over the valid region of the MACD line.
  const start = slow - 1
  const valid = macdLine.slice(start)
  const sig = ema(valid, signalPeriod)
  const signal = new Array<number>(closes.length).fill(NaN)
  for (let i = 0; i < sig.length; i++) signal[start + i] = sig[i]
  const histogram = macdLine.map((v, i) => v - signal[i])
  return { macd: macdLine, signal, histogram }
}

export interface BollingerResult {
  middle: number[]
  upper: number[]
  lower: number[]
}

export function bollinger(closes: number[], period = 20, mult = 2): BollingerResult {
  const middle = sma(closes, period)
  const upper = new Array<number>(closes.length).fill(NaN)
  const lower = new Array<number>(closes.length).fill(NaN)
  for (let i = period - 1; i < closes.length; i++) {
    let sumSq = 0
    for (let j = i - period + 1; j <= i; j++) {
      const d = closes[j] - middle[i]
      sumSq += d * d
    }
    const sd = Math.sqrt(sumSq / period)
    upper[i] = middle[i] + mult * sd
    lower[i] = middle[i] - mult * sd
  }
  return { middle, upper, lower }
}

export function atr(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const out = new Array<number>(closes.length).fill(NaN)
  if (closes.length <= period) return out
  const tr: number[] = [highs[0] - lows[0]]
  for (let i = 1; i < closes.length; i++) {
    tr.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1]),
      ),
    )
  }
  let prev = tr.slice(0, period).reduce((a, b) => a + b, 0) / period
  out[period - 1] = prev
  for (let i = period; i < closes.length; i++) {
    prev = (prev * (period - 1) + tr[i]) / period
    out[i] = prev
  }
  return out
}

/** Rolling annualized volatility from daily closes (window in trading days). */
export function rollingVol(closes: number[], window = 21): number[] {
  const out = new Array<number>(closes.length).fill(NaN)
  const rets: number[] = [NaN]
  for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]))
  for (let i = window; i < closes.length; i++) {
    let mean = 0
    for (let j = i - window + 1; j <= i; j++) mean += rets[j]
    mean /= window
    let sumSq = 0
    for (let j = i - window + 1; j <= i; j++) sumSq += (rets[j] - mean) ** 2
    out[i] = Math.sqrt((sumSq / (window - 1)) * 252)
  }
  return out
}
