import m from "mithril"
import { Select } from "./form.js"

type PaginationStyle = {
  parent: string
  prev: string
  next: string
  itemContainer: string
  itemOuter?: string
  item: string
  itemSkip: string
  itemCurrent: string
  pageSizeContainer?: string
}

export type PaginationAttrs = Partial<{
  total: number
  selected: number
  onPageChange: (newPageNum: number) => void

  pageSize: number
  pageSizeOptions: number[]
  onPageSizeChange: (newPageSizeNum: number) => void

  proximity: number
  nextIndicator: m.Child
  prevIndicator: m.Child
  skipIndicator: m.Child
  style: PaginationStyle
}>

export const bulmaPaginationStyle: PaginationStyle = {
  parent: "nav.pagination",

  prev: "a.pagination-previous",
  next: "a.pagination-next",

  itemContainer: "ul.pagination-list",
  itemOuter: "li",
  item: "a.pagination-link",
  itemSkip: "span.pagination-ellipsis",
  itemCurrent: "a.pagination-link.is-current",

  pageSizeContainer: ".select",
}

export const PaginationStateful: m.ClosureComponent<{
  state?: PaginationAttrs
}> = initialVnode => {
  const { state = {} } = initialVnode.attrs
  const _change = state.onPageChange
  state.onPageChange = pageNumber => {
    _change && _change(pageNumber), (state.selected = pageNumber)
  }

  return { view: () => m(Pagination, state) }
}

export const Pagination: m.Component<PaginationAttrs> = {
  view: vNode => {
    const {
      total = 0,
      selected = 1,
      onPageChange = () => {},

      pageSize,
      pageSizeOptions = [5, 10, 15, 20],
      onPageSizeChange = () => {},

      proximity = 2,
      prevIndicator = "←", // "←" "⇽" "⟵" "⇐" "⊲" "‹" "◃" "◂" "≺" "≪" "⋘" "⦑" "⟨" "⟪" "⧏" "⪡" "⪻" "«" "⪦"
      nextIndicator = "→", // "→" "⇾" "⟶" "⇒" "⊳" "›" "▹" "▸" "≻" "≫" "⋙" "⦒" "⟩" "⟫" "⧐" "⪢" "⪼" "»" "⪧"
      skipIndicator = "…", // "‥"
      style = bulmaPaginationStyle,
    } = vNode.attrs

    const item = style.itemOuter
      ? (num: number, current = false) =>
          m(
            style.itemOuter!,
            { key: "p" + num },
            m(
              current ? style.itemCurrent : style.item,
              {
                "aria-label": "Go to Page " + num,
                onclick: () => onPageChange(num),
              },
              num
            )
          )
      : (num: number, current = false) =>
          m(
            current ? style.itemCurrent : style.item,
            {
              key: "p" + num,
              "aria-label": "Go to Page " + num,
              onclick: () => onPageChange(num),
            },
            num
          )

    const skipR = style.itemOuter
      ? m(style.itemOuter, { key: "skipR" }, m(style.itemSkip, skipIndicator))
      : m(style.itemSkip, { key: "skipR" }, skipIndicator)
    const skipL = style.itemOuter
      ? m(style.itemOuter, { key: "skipL" }, m(style.itemSkip, skipIndicator))
      : m(style.itemSkip, { key: "skipL" }, skipIndicator)

    function* range(start: number, end: number, map: (v: number) => m.Child) {
      for (let i = start; i <= end; i++) {
        yield map(i)
      }
    }

    const pageSelect = m(Select, {
      options: pageSizeOptions.map(n => "" + n),
      selected: [pageSize + ""],
      onSelect: s => onPageSizeChange(Number(s[0])),
    })

    const list = (selected: number) => [
      ...(selected > proximity + 3
        ? [item(1), skipL, ...range(selected - proximity, selected - 1, item)]
        : range(1, selected - 1, item)),
      item(selected, true),
      ...(selected < total - proximity - 2
        ? [
            ...range(selected + 1, selected + proximity, item),
            skipR,
            item(total),
          ]
        : range(selected + 1, total, item)),
    ]
    return m(
      style.parent,
      { role: "navigation", "aria-label": "pagination" },
      pageSize &&
        (style.pageSizeContainer
          ? m(style.pageSizeContainer, pageSelect)
          : pageSelect),
      m(
        style.prev,
        {
          onclick: () => selected > 1 && onPageChange(selected - 1),
          disabled: selected <= 1,
        },
        prevIndicator
      ),
      m(
        style.next,
        {
          onclick: () => selected < total && onPageChange(selected + 1),
          disabled: selected >= total,
        },
        nextIndicator
      ),
      m(style.itemContainer, list(selected))
    )
  },
}
