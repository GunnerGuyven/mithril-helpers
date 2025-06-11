const __nullFunc = () => {}

/**
 * Performs countdown by descending integer increments
 */
export const PerformCountdown = ({
	tick = __nullFunc,
	done = __nullFunc,
	tickRate = 1000,
	start = 5,
	end = 0,
	running = true,
	verbose = tick === done && done === __nullFunc,
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
	/** If false, countdown does not proceed, default = true */
	running: boolean
	/**
	 * If set true or if no handlers provided
	 * event notifications will emit to console
	 */
	verbose: boolean
}> = {}) => {
	if (verbose) {
		const _tick = tick
		const _done = done
		tick = (curr, dest) => (
			console.info(`Countdown from ${curr} to ${dest}`), _tick(curr, dest)
		)
		done = () => (console.info("Countdown complete"), _done())
	}
	const step = () =>
		running &&
		(start > end ? (tick(start--, end), setTimeout(step, tickRate)) : done())
	running && step()
	return {
		stop: () => (running = false),
		start: () => ((running = true), step()),
	}
}

// export const TryParseJSON = (textToParse: string) => {
//   try {
//     return JSON.parse(textToParse)
//   } catch (_err) {
//     return null
//   }
// }

export const CreateRealtimeChannel_WS = (
	url: string,
	props: Partial<{
		/**
		 * number of seconds after socket close to attempt reconnection;
		 * if set to 0, no reconnection will be attempted;
		 * default = 5
		 */
		reconnectTimeout: number
		/**
		 * message to send immediately upon reconnection;
		 * if not set no message will be sent
		 */
		reconnectSendMessage: string | object
		onOpen: (this: WebSocket, e: Event) => void
		onMessage: (this: WebSocket, e: MessageEvent) => void
		onClose: (this: WebSocket, e: CloseEvent) => void
		onError: (this: WebSocket, e: Event) => void
		/**
		 * Action to take on every status change event;
		 * useful for setting a dirty flag or refreshing displays
		 */
		onAll: () => void
		/**
		 * If set true or if no handlers (other than onAll) provided
		 * event notifications will emit to console
		 */
		verbose: boolean
	}> = {},
) => {
	const {
		reconnectTimeout = 5,
		reconnectSendMessage,
		onOpen,
		onMessage,
		onClose,
		onError,
		onAll,
		verbose = !(onOpen || onMessage || onClose || onError),
	} = props
	const setupSocket = (reconnect = false) => {
		const _ws = new WebSocket(url)
		if (verbose) {
			_ws.onopen = e => console.info("CreateRealtimeChannel_WS open", e)
			_ws.onerror = e => console.info("CreateRealtimeChannel_WS error", e)
			_ws.onclose = e => console.info("CreateRealtimeChannel_WS close", e)
			_ws.onmessage = e => console.info("CreateRealtimeChannel_WS message", e)
		}
		onOpen && _ws.addEventListener("open", onOpen)
		onMessage && _ws.addEventListener("message", onMessage)
		onError && _ws.addEventListener("error", onError)
		onClose && _ws.addEventListener("close", onClose)

		if (onAll) {
			_ws.addEventListener("open", onAll)
			_ws.addEventListener("message", onAll)
			_ws.addEventListener("error", onAll)
			_ws.addEventListener("close", onAll)
		}

		reconnect &&
			reconnectSendMessage &&
			_ws.addEventListener("open", () => send(reconnectSendMessage))

		reconnectTimeout &&
			_ws.addEventListener("close", () => {
				reconnectStop = PerformCountdown({
					start: reconnectTimeout,
					tick: count => ((reconnectCount = count), onAll && onAll()),
					done: reconnectNow,
					verbose,
				}).stop
			})

		return _ws
	}
	let reconnectCount = 0
	let reconnectStop = () => {}
	const reconnectNow = () => ((ws = setupSocket(true)), (reconnectCount = 0))
	let ws = setupSocket()

	const send = (msg: string | object) => {
		verbose && console.info("CreateRealtimeChannel_WS send", msg)
		ws.send(JSON.stringify(typeof msg === "string" ? { text: msg } : msg))
	}

	return {
		reconnectNow,
		reconnectCancel: () => (reconnectStop(), (reconnectCount = 0)),
		get reconnectCount() {
			return reconnectCount
		},
		get websocketStateCode() {
			return ws.readyState
		},
		get websocketStateLabel() {
			return (
				ws.readyState === WebSocket.CONNECTING ? "CONNECTING"
				: ws.readyState === WebSocket.OPEN ? "OPEN"
				: ws.readyState === WebSocket.CLOSING ? "CLOSING"
				: "CLOSED"
			)
		},
		send,
	}
}

const itemsToString = ({
	items = Array<string | false>(),
	delimiter = " ",
	prefix = "",
}) => {
	const result = items.filter(i => i).join(delimiter)
	return result && prefix + result
}

/**
 * items that are 'false' or blank will be omitted from outcome
 */
export const SpaceDelimitedStringFromItems = (...items: (string | false)[]) =>
	itemsToString({ items })

export const TryParseJSON = (
	textToParse: string,
	parseFail?: (err: unknown) => void,
) => {
	try {
		return JSON.parse(textToParse) as unknown
	} catch (err) {
		parseFail && parseFail(err)
	}
	return null
}

export const TryParseJSONAsType = <T>(
	textToParse: string,
	typeCheck: (test: unknown) => test is T,
	parseFail?: (err: unknown) => void,
) => {
	const x: unknown = TryParseJSON(textToParse, parseFail)
	if (x && typeCheck(x)) return x
	return null
}
