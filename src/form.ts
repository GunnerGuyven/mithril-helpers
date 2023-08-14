import m from "mithril"

type SelectOption = string | [value: string, label: string]
export const Select: m.ClosureComponent<
  Partial<{
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
    onSelect: (value: string[]) => void
  }>
> = initialVnode => {
  const {
    options = [],
    selected,
    groups,
    multiple,
    size,
    onSelect = () => {},
  } = initialVnode.attrs

  const makeOption = (opt: SelectOption) => {
    const [value, label] = Array.isArray(opt) ? opt : [opt, opt]
    return m("option", { value, selected: selected?.includes(value) }, label)
  }

  const items =
    groups?.map(([label, count]) =>
      m("optgroup", { label }, options.splice(0, count).map(makeOption))
    ) || []

  items.push(...options.map(makeOption))

  return {
    view: () =>
      m(
        "select",
        {
          oninput: (e: { target: HTMLSelectElement }) =>
            onSelect([...e.target.selectedOptions].map(o => o.value)),
          multiple,
          size,
        },
        items
      ),
  }
}
