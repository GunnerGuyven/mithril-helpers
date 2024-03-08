import m from "mithril"

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
        options.slice(optionsOffset, (optionsOffset += count)).map(makeOption)
      )
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
      items
    )
  },
}

export const SelectStateful: m.ClosureComponent<{
  state?: SelectAttrs
  onOptionChangeResetSelected?: boolean
}> = initialVnode => {
  const { state = {}, onOptionChangeResetSelected = false } = initialVnode.attrs
  const _select = state.onSelect
  state.onSelect = value => {
    _select && _select(value), (state.selected = value)
  }
  const resetSelected = () => {
    if (state.options?.length) {
      const o = state.options[0]
      state.selected = [Array.isArray(o) ? o[0] : o]
    }
  }
  state.selected || resetSelected()
  let lastOptions = state.options
  return {
    view: vnode => {
      if (onOptionChangeResetSelected) {
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
