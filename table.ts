import m, { Children } from "mithril"
import { Select } from "./form.ts"

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

type PaginationAttrs = Partial<{
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
            style.itemOuter || "",
            { key: `p${num}` },
            m(
              current ? style.itemCurrent : style.item,
              {
                "aria-label": `Go to Page ${num}`,
                onclick: () => onPageChange(num),
              },
              num,
            ),
          )
      : (num: number, current = false) =>
          m(
            current ? style.itemCurrent : style.item,
            {
              key: `p${num}`,
              "aria-label": `Go to Page ${num}`,
              onclick: () => onPageChange(num),
            },
            num,
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
      options: pageSizeOptions.map(n => n.toFixed()),
      selected: pageSize ? [pageSize.toFixed()] : undefined,
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
        prevIndicator,
      ),
      m(
        style.next,
        {
          onclick: () => selected < total && onPageChange(selected + 1),
          disabled: selected >= total,
        },
        nextIndicator,
      ),
      m(style.itemContainer, list(selected)),
    )
  },
}

type GridDataRow = { cells: Children[]; subGrid?: GridData }
export type GridData = {
  meta: Partial<{ subGridFieldIdx: number; showHeader: boolean }>
  columns: Children[]
  rows: GridDataRow[]
}

const GridField: m.Component<{
  isHeader?: boolean
  value: Children
}> = {
  view: vnode => {
    const { value, isHeader = false } = vnode.attrs
    return m(
      isHeader ? "th" : "td",
      value === true ? "true" : value === false ? "false" : value,
    )
  },
}

const GridHeaderRow: m.Component<{
  columns: Children[]
}> = {
  view: vnode => {
    const { columns } = vnode.attrs
    return m(
      "tr",
      columns.map(f => m(GridField, { value: f, isHeader: true })),
    )
  },
}

const GridRow: m.Component<{
  row: GridDataRow
  renderKey: string | number
  subGridFieldIdx: number
}> = {
  view: vnode => {
    const { row, renderKey, subGridFieldIdx } = vnode.attrs
    const cells: Children[] = row.cells.map(f => m(GridField, { value: f }))
    row.subGrid &&
      cells.splice(subGridFieldIdx, 0, m(Grid, { data: row.subGrid }))
    return m(`tr[key-in=${renderKey}]`, { key: renderKey }, cells)
  },
}

export const Grid: m.Component<{ data?: GridData }> = {
  view: vnode => {
    const { data } = vnode.attrs
    const { meta, rows, columns } = data || {
      meta: { showHeader: true },
      rows: [],
      columns: [],
    }
    return columns.length
      ? m(
          "table",
          meta.showHeader && m("thead", m(GridHeaderRow, { columns })),
          rows.map((row, idx) =>
            m(GridRow, {
              row,
              renderKey: idx,
              subGridFieldIdx: meta.subGridFieldIdx || -1,
            }),
          ),
        )
      : m("", "Empty Result")
  },
}

export type PagedGridData = GridData & { paginationProps: PaginationAttrs }
export const PagedGrid: m.Component<
  Partial<{
    data: PagedGridData
    paginationAbove: boolean
    paginationBelow: boolean
  }>
> = {
  view: vnode => {
    const {
      data,
      paginationAbove = false,
      paginationBelow = true,
    } = vnode.attrs

    return [
      paginationAbove && m(Pagination, data?.paginationProps || {}),
      m(Grid, { data }),
      paginationBelow && m(Pagination, data?.paginationProps || {}),
    ]
  },
}

type GridDataSubItem = Record<string, Children>[]
export const createGridData = (
  data?: Record<string, Children | GridDataSubItem>[],
  {
    showHeader = true,
    autoDetectSubGridField = true,
    subGridField,
    subGridFieldIdx = -1,
  }: Partial<{
    showHeader: boolean
    subGridField: string
    subGridFieldIdx: number
    autoDetectSubGridField: boolean
  }> = {},
): GridData | undefined => {
  if (!data || !data.length) return undefined
  const columns = Object.keys(data[0])
  subGridFieldIdx = subGridField ? columns.indexOf(subGridField) : -1
  if (subGridFieldIdx === -1 && autoDetectSubGridField) {
    subGridFieldIdx = Object.values(data[0]).findIndex(v => Array.isArray(v))
  }

  const rows = data.map(r => {
    const x = Object.values(r)
    const subGrid =
      subGridFieldIdx > -1 &&
      (x.splice(subGridFieldIdx, 1)[0] as GridDataSubItem)
    return {
      cells: x as Children[],
      subGrid: createGridData(subGrid || undefined),
    }
  })

  return { rows, columns, meta: { subGridFieldIdx, showHeader } }
}

export const paginateGridData = (
  gridData?: GridData,
  paging?: Partial<{ pageSize: number; currentPage: number }>,
): PagedGridData | undefined => {
  if (!gridData) return undefined
  const { pageSize = 10, currentPage = 1 } = paging || {}
  const p = {
    selected: currentPage,
    pageSize,
    get total() {
      return Math.ceil(gridData.rows.length / p.pageSize)
    },
    onPageSizeChange: (size: number) => (
      (p.pageSize = size),
      (p.selected = Math.min(p.selected, p.total)),
      (_page = pageTo(p.selected))
    ),
    onPageChange: (newPage: number) => (
      (p.selected = newPage), (_page = pageTo(p.selected))
    ),
  }
  const pageTo = (num: number) =>
    gridData.rows.slice((num - 1) * p.pageSize, num * p.pageSize)
  let _page = pageTo(currentPage)

  // mixing spread with get does not work before ES2018
  return {
    ...gridData,
    get rows() {
      return _page
    },
    paginationProps: p,
  }
}
