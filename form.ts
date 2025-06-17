import m from "mithril"

export type InputAttrs = Partial<{
	/** initial input value */
	value: string
	/** input type */
	type: string
	/** event fired on value change */
	onInput: (value: string) => void
}>
export const Input: m.Component<InputAttrs> = {
	view: vnode => {
		const { value, type, onInput = () => {} } = vnode.attrs
		return m("input", {
			value,
			type,
			oninput: (e: { target: HTMLInputElement }) => onInput(e.target.value),
		})
	},
}

export const InputStateful: m.ClosureComponent<{
	state?: InputAttrs
}> = initialVnode => {
	const { state = {} } = initialVnode.attrs
	const _input = state.onInput
	state.onInput = value => {
		_input && _input(value), (state.value = value)
	}
	return { view: () => m(Input, state) }
}

type SelectOption = string | [value: string, label: string]
export type SelectAttrs = Partial<{
	/**
	 * list of options to display in this select
	 * each item may be formatted as single string value,
	 * or tuple of strings [value, label]
	 */
	options: SelectOption[]
	/** enable multi-select (default: false) */
	multiple: boolean
	/** number of rows visible at a time, 0 is disabled (default: 0) */
	size: number
	/**
	 * A set of label and size pairs,
	 * options are added accordingly to groups in the order they are given
	 * [ [label, size], ... ]
	 */
	groups: [label: string, size: number][]
	/** the value(s) to pre-select */
	selected: string[]
	/** event fired on selection change */
	onSelect: (values: string[]) => void
	onSelectIndex: (index: number) => void
}>
export const Select: m.Component<SelectAttrs> = {
	view: vnode => {
		const {
			options = [],
			selected,
			groups = [],
			multiple,
			size,
			onSelect = () => {},
			onSelectIndex = () => {},
		} = vnode.attrs

		const makeOption = (opt: SelectOption) => {
			const [value, label] = Array.isArray(opt) ? opt : [opt, opt]
			return m("option", { value, selected: selected?.includes(value) }, label)
		}

		let optionsOffset = 0
		const items = groups.map(([label, count]) =>
			m(
				"optgroup",
				{ label },
				options.slice(optionsOffset, (optionsOffset += count)).map(makeOption),
			),
		)
		items.push(...options.slice(optionsOffset).map(makeOption))

		return m(
			"select",
			{
				oninput: (e: { target: HTMLSelectElement }) => (
					onSelect([...e.target.selectedOptions].map(o => o.value)),
					onSelectIndex(e.target.selectedIndex)
				),
				multiple,
				size,
			},
			items,
		)
	},
}

export const SelectStateful: m.ClosureComponent<{
	state?: SelectAttrs
	whenOptionChangeResetSelected?: boolean
}> = initialVnode => {
	const { state = {}, whenOptionChangeResetSelected = false } =
		initialVnode.attrs
	const _select = state.onSelect
	state.onSelect = value => {
		_select && _select(value), (state.selected = value)
	}
	const resetSelected = () => {
		if (state.options?.length) {
			const o = state.options[0]
			state.selected = [Array.isArray(o) ? o[0] : o]
			_select && _select(state.selected)
		}
	}
	state.selected || resetSelected()
	let lastOptions = state.options
	return {
		view: vnode => {
			if (whenOptionChangeResetSelected) {
				const newOptions = vnode.attrs.state?.options
				if (newOptions != lastOptions) {
					lastOptions = newOptions
					resetSelected()
				}
			}
			return m(Select, state)
		},
	}
}

/**
 * Provides a clickable control that toggles between light and dark mode for
 * your application.  You must supply the visible element of this control (can
 * be an image, text or anything else).
 *
 * This stores your setting in localStorage if it is contrary to the matchMedia
 * (OS / browser setting).  It also clears localStorage if setting agrees with
 * matchMedia.  This means it only toggles between native mode and opposite
 * mode.  Additionally if the OS or browser setting is changed it is respected
 * (unless you have manually chosen the opposite).
 *
 * Dark mode is enabled by adding a 'dark' class to the root element of the
 * page. If using tailwindcss you can capitalize on this by overriding the
 * builtin `dark:` rule prefix with this in your css:
 *
 * `@custom-variant dark (&:where(.dark, .dark *));`
 */
export const ThemeToggleLink: m.ClosureComponent<m.Attributes> = () => {
	const updateDarkMode = () => {
		const match =
			matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

		const currentTheme =
			localStorage.getItem("theme") ?
				localStorage.getItem("theme") == "dark" ?
					"dark"
				:	"light"
			:	match

		document.documentElement.classList.toggle("dark", currentTheme == "dark")

		if (currentTheme == match) {
			localStorage.removeItem("theme")
		}
	}

	matchMedia("(prefers-color-scheme: dark)").onchange = updateDarkMode

	updateDarkMode()

	return {
		view: vnode =>
			m(
				"a",
				{
					onclick: () => {
						const currLocalMode = localStorage.getItem("theme")
						localStorage.setItem(
							"theme",
							currLocalMode ?
								currLocalMode == "dark" ?
									"light"
								:	"dark"
							: matchMedia("(prefers-color-scheme: dark)").matches ? "light"
							: "dark",
						)
						updateDarkMode()
					},
					title: "toggle theme",
					...vnode.attrs,
				},
				vnode.children,
			),
	}
}
