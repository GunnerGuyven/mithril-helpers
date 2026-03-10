// TODO:
// - [ ] StateManager
// 	- [ ]
// 	- [ ]
// 	- [ ]
// 	- [ ]
// 	- [ ]
//
// const stateManager = state => {
//   state = state || {}
//   const set = (id, key, value, deleteOnEmpty = false) => {
//     state[id] = state[id] || {}
//     state[id][key] = value
//     deleteOnEmpty && !value && delete state[id][key]
//   }
//   const get = (id, key) => (key ? (state[id] || {})[key] : state[id] || {})
//   const toggle = (id, key) => set(id, key, !get(id, key))
//   const clear = id => (state[id] = {})
//   const dirty = (id, key) => get(id, key) && (set(id, key, false), true)
//   return { set, get, toggle, clear, dirty }
// }

type KeyTypes = ["sort", "dir"] | ["search"] | [...string[]]
type ValueFor<K extends KeyTypes> =
	K extends ["sort", "dir"] ? string
	: K extends ["sort", "field"] ? string
	: K extends ["search"] ? Record<string, unknown>
	: unknown

export type Bag = {
	set: <K extends KeyTypes>(
		key: K,
		value: ValueFor<K>,
		deleteOnEmpty?: boolean,
	) => Bag
	get: <K extends KeyTypes>(key: K) => ValueFor<K>
	toObj: () => Record<string, unknown>
}

export const bag = (
	contents: Map<string, unknown> = new Map<string, unknown>(),
): Bag => {
	const makeKey = (k: KeyTypes) => JSON.stringify(k)
	const b: Bag = {
		set: (key, value, deleteOnEmpty = false) => {
			if (deleteOnEmpty && !value) {
				contents.delete(makeKey(key))
			} else {
				contents.set(makeKey(key), value)
			}
			return b
		},
		get: <K extends KeyTypes>(key: K) =>
			contents.get(makeKey(key)) as ValueFor<K>,
		toObj: () =>
			contents.entries().reduce(
				(a, [key, value]) => {
					a[key] = value
					return a
				},
				{} as Record<string, unknown>,
			),
	}
	return b
}

const y = bag()
console.log("start", y.toObj())
y.set(["a", "b"], "goat cheese")
console.log("first", y.toObj())
console.log("get ['a', 'b']", y.get(["a", "b"]))
