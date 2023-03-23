/**
 * Performs countdown by descending integer increments
 */
export const doCountdown = ({
  tick = (curr: number, dest: number) =>
    console.info(`Countdown from ${curr} to ${dest}`),
  done = () => console.info("Countdown complete"),
  tickRate = 1000,
  start = 5,
  end = 0,
}: Partial<{
  /** Called immediately and on every update of the countdown value */
  tick: (current: number, destination: number) => void
  /** Called when countdown ends */
  done: () => void
  /** Speed of countdown increments expressed in milliseconds (ms) */
  tickRate: number
  /** Starting value of countdown (`tick` is called immediately with this value) */
  start: number
  /** Ending value of countdown (`tick` is not called, rather `done` is) */
  end: number
}> = {}) =>
  (function step() {
    start > end ? (tick(start--, end), setTimeout(step, tickRate)) : done()
  })()
