import m, { type Attributes, type Vnode } from "mithril"
import { LabelFromKey } from "@guyven/mithril-helpers/util"
import { Bag, bag } from "./keybag.ts"

type Field = string
type Label = string
type FieldDefinition = [Field, Label] | Field | FieldDefinitionNormalized
type FieldDefinitionNormalized = {
	field: Field
	label: Label
	[property: string]: unknown
}
type DestructField = (field: FieldDefinition) => FieldDefinitionNormalized
type FieldDefaults = Record<string, unknown>

const destructField: DestructField = field =>
	Array.isArray(field) ? { field: field[0], label: field[1] }
	: typeof field === "object" ?
		{ ...field, label: field.label || LabelFromKey(field.field) }
	:	{ field, label: LabelFromKey(field) }

const destructFieldWithDefaults: (defaults: FieldDefaults) => DestructField =
	defaults => field =>
		Object.assign({}, defaults, destructField(field))

// type State<V = unknown> = Record<string, Record<string, V>>
// type StateManager<V = unknown> = {
// 	set: (id: string, key: string, value: V, deleteOnEmpty?: boolean) => void
// 	get: (id: string, key?: string) => V
// 	toggle: (id: string, key: string) => void
// 	clear: (id: string) => void
// 	dirty: (id: string, key: string) => boolean
// }

// const stateManager = <V>(state: State<V>) => {
// 	state = state || {}
// 	const set = (id: string, key: string, value: V, deleteOnEmpty = false) => {
// 		state[id] = state[id] || {}
// 		state[id][key] = value
// 		deleteOnEmpty && !value && delete state[id][key]
// 	}
// 	const get = (id: string, key?: string) =>
// 		key ? (state[id] || {})[key] : state[id] || {}
// 	const toggle = (id: string, key: string) => set(id, key, !get(id, key))
// 	const clear = (id: string) => (state[id] = {})
// 	const dirty = (id: string, key: string) =>
// 		get(id, key) && (set(id, key, false), true)
// 	return { set, get, toggle, clear, dirty } as StateManager<V>
// }

const stateManager = bag

type DataTableAttrs = {
	attrs: Attributes
	fieldDefaults?: FieldDefaults
	state?: Map<string, unknown>
	detailInterleve?: boolean
	checkable?: boolean
	sortable?: boolean
	sortStateCachingLevels?: number
	searchable?: boolean
	showHead?: boolean
	showFoot?: boolean
	stickyHeaders?: boolean
	disableInternalSort?: boolean
	enableDataIDs?: boolean
	onSortUpdated?: (field: string, direction: string) => void
}

export const DataTable: m.ClosureComponent<DataTableAttrs> = initialVnode => {
	const {
		attrs: tableAttrs,
		fieldDefaults = {},
		data: initialData = {},
		state,
		detailRow,
		detailInterleve,
		detailExpandOnRowClick,
		detailExpandOnSingleRow,
		checkable,
		sortable,
		sortStateCachingLevels = 4,
		searchable,
		stateActions = {},
		onSortUpdated = () => {},
		onSearchUpdated = () => {},
		onRowClicked = () => {},
		showHead = true,
		showFoot = true,
		footerRow,
		stickyHeaders,
		disableInternalSort,
		enableDataIDs,
	} = initialVnode.attrs

	const destructField = destructFieldWithDefaults(fieldDefaults)
	const { set, get, toggle, clear } = stateManager(state)
	const nextSortOption = (
		field: unknown,
		sortOptions = ["asc", "desc"], //, ""],
		currIndex = sortOptions.indexOf(get(["sort", "dir"])),
	) =>
		(
			currIndex >= 0 &&
			currIndex < sortOptions.length - 1 &&
			field === get(["sort", "field"])
		) ?
			sortOptions[currIndex + 1]
		:	sortOptions[0]
	stateActions.filterCriteriaClear = () => (
		clear("search"),
		onSearchUpdated({})
	)
	stateActions.filterCriteriaLength = () => Object.keys(get(["search"])).length

	const head: m.ClosureComponent = () => {
		return {
			view: ({ attrs }) => [
				m("tr", [
					detailRow && m("td"),
					...showFieldLabels({
						fields: attrs.fields,
						fieldDefaults,
						sortable,
						state: {
							get: field =>
								get(["sort", "field"]) === field && get(["sort", "dir"]),
							toggle: field => (
								set(["sort", "dir"], nextSortOption(field)),
								set(["sort", "field"], field),
								set(["sort", "dirty"], true)
							),
						},
						onSortUpdated,
					}),
					checkable && m("td"),
				]),
				searchable &&
					m("tr", [
						detailRow && m("td"),
						...attrs.fields
							.map(destructField)
							//.map(v => (echo(JSON.stringify(v)), v))
							.map(({ field, noSearch, searchOptions }) =>
								m(
									"td",
									field &&
										!noSearch &&
										Input({
											selectOptions: searchOptions || [],
											preProcess: () => get("search", field),
											postProcess: v => (
												set(["search", field], v, true),
												onSearchUpdated(get(["search"]))
											),
										}),
								),
							),
					]),
			],
		}
	}

	const keysFromRows = (rows, idField) => rows.map(r => r[idField]).join("|")
	const sortKey = (rows, idField, sortField, sortDir) =>
		[keysFromRows(rows, idField), sortField, sortDir].join("-")
	const tableCacheKey = {}

	return {
		//oninit: ({ attrs }) => console.debug("table init", attrs),
		view: ({ attrs }) => {
			//console.info("table attrs", attrs)
			const _d = attrs.data || initialData
			const data = typeof _d === "function" ? _d() : _d
			if (data.status) {
				if (!data.status.done) {
					return m(".loading", data.status.progress())
				}
				stateActions.dataRefresh = data.refresh
			}

			const {
				rowsOverride,
				selectedRowIDs = [],
				fields: displayFields = [],
			} = attrs
			const dataObj = data.status ? data.result : data
			const idField = (dataObj && dataObj.listID) || Defaults.IDField
			let rows =
				rowsOverride ||
				(dataObj && dataObj.list) ||
				(Array.isArray(dataObj) && dataObj) ||
				[]
			const fields =
				displayFields.length === 0 && rows.length > 0 ?
					Object.keys(rows[0])
				:	displayFields

			const [sortField, sortDir] = [get("sort", "field"), get("sort", "dir")]
			const getFieldProp = (fieldName, propName) => {
				const x = fields.find(f => f.field === fieldName)
				return x && x[propName]
			}
			const getFieldShow = fieldName =>
				getFieldProp(fieldName, "show") || (() => 0)
			const fieldNormalizer =
				sortField && sortDir && getFieldProp(sortField, "numeric") ?
					row => Number(row[sortField] || getFieldShow(sortField)(row))
				:	row => {
						// pull sort field from row and
						// normalize values to uppercase
						// if they can be
						const val = row[sortField] || getFieldShow(sortField)(row)
						return val.toUpperCase ? val.toUpperCase() : val
					}
			disableInternalSort ||
				(sortField &&
					sortDir &&
					(rows = Cache.get(
						tableCacheKey,
						sortKey(rows, idField, sortField, sortDir),
						{
							sizeCap: sortStateCachingLevels,
							getter: () =>
								rows.sort((a, b) => {
									//debugger
									a = fieldNormalizer(a)
									b = fieldNormalizer(b)
									//console.log({ a, b })
									const dir = sortDir === "desc" ? -1 : 1
									if (a < b) return -1 * dir
									if (a > b) return 1 * dir
									return 0
								}),
						},
					)))

			// console.debug(Cache.toObj())

			detailExpandOnSingleRow &&
				rows.length === 1 &&
				set(rows[0][idField], "expanded", true)

			return m(
				"table.table.is-fullwidth.is-hoverable",
				tableAttrs,
				showHead &&
					m(
						"thead",
						{ class: c(stickyHeaders && "sticky") },
						m(head, { fields }),
						stickyHeaders &&
							m(
								"tr.border",
								m("td", { colspan: fields.length + !!checkable + !!detailRow }),
							),
					),
				(footerRow &&
					m(
						"tfoot",
						typeof footerRow === "function" ? footerRow() : footerRow,
					)) ||
					(showFoot &&
						m(
							"tfoot",
							{ class: c(stickyHeaders && "sticky") },
							stickyHeaders &&
								m(
									"tr.border",
									m("td", {
										colspan: fields.length + !!checkable + !!detailRow,
									}),
								),
							m(head, { fields }),
						)),
				m(
					"tbody",
					rows.length ?
						rows
							.map(row => {
								const rowID = row[idField]
								if (detailRow) {
									row.toggleDetail = () => toggle(rowID, "expanded")
									row.isDetailShowing = () => get(rowID, "expanded")
									row.setDetailShow = show => set(rowID, "expanded", show)
								}
								if (checkable) {
									row.toggleCheck = () => toggle(rowID, "checked")
									row.isChecked = () => get(rowID, "checked")
									row.setChecked = checked => set(rowID, "checked", checked)
								}
								return row
							})
							.map(row => [
								m(
									"tr.data-row",
									{
										key: row[idField],
										"data-id": enableDataIDs && row[idField],
										onclick: e => (
											detailExpandOnRowClick && row.toggleDetail(),
											onRowClicked(row, e)
										),
										class: c(
											selectedRowIDs.includes(row[idField]) && "is-selected",
											get(row[idField], "expanded") && "is-expanded",
											detailExpandOnRowClick && "clickable",
										),
									},
									[
										detailRow &&
											m(
												"td.detail-chevron",
												m(
													"a",
													{
														onclick:
															detailExpandOnRowClick ||
															(e => {
																e.stopPropagation()
																toggle(row[idField], "expanded")
															}),
													},
													i("angle-right"),
												),
											),
										...fields
											.map(destructField)
											.map(({ field, show: fshow, justifyRight, classes }) => {
												const show = fshow ? fshow(row) : row[field]
												return m(
													"td",
													{
														class: c(
															justifyRight && "has-text-right",
															...(classes || []),
														),
													},
													show,
												)
											}),
										checkable &&
											m(
												"td.checkbox-cell",
												m(
													"label.checkbox",
													m("input[type=checkbox]", {
														oninput: e =>
															set(row[idField], "checked", e.target.checked),
														checked: get(row[idField], "checked"),
													}),
												),
											),
									],
								),
								detailRow && get(row[idField], "expanded") ?
									detailInterleve ? detailRow(row, { key: row[idField] + "-d" })
									:	m(
											"tr.detail",
											{ key: row[idField] + "-d" },
											m(
												"td",
												{ colspan: fields.length + (checkable ? 2 : 1) },
												m(".detail-container", detailRow(row)),
												// detailRow(row)
											),
										)
								:	m.fragment({ key: row[idField] + "-d" }, []),
							])
					:	m(
							"tr.detail",
							m(
								"td",
								{ colspan: fields.length + (checkable ? 2 : 1) },
								m(".detail-container", "No results"),
							),
						),
				),
			)
		},
	}
}

const i = (name: string, attrs: m.Attributes, prefix = "fas") =>
	m("span.icon", attrs, m(`i.${prefix}.fa-${name}`))

type ShowFieldLabelsProps = {
	fields?: FieldDefinition[]
	fieldDefaults: FieldDefaults
	sortable?: boolean
	state: {
		get: (field: string) => string | false
		toggle: (field: string) => void
	}
	onSortUpdated?: (field: string, direction: string) => void
}

// const showFieldLabels: (props: ShowFieldLabelsProps) => Vnode = ({
const showFieldLabels: (props: ShowFieldLabelsProps) => m.ChildArray = ({
	fields = [],
	fieldDefaults = {},
	sortable = false,
	state,
	onSortUpdated = () => {},
}) =>
	fields
		.map(destructFieldWithDefaults(fieldDefaults))
		.map(
			({
				label,
				field,
				sortable: fieldSortable,
				headerAttrs,
				justifyRight,
				headerClasses,
				classes,
			}) => {
				const isSort =
					field && (fieldSortable === false ? false : fieldSortable || sortable)
				const sortDir: string = state.get(field) || "none"
				return m(
					"th",
					{
						...(headerAttrs || {}),
						class: c(
							justifyRight && "has-text-right",
							isSort && "is-sortable",
							...(headerClasses || classes || []),
						),
						onclick: () =>
							isSort &&
							(state.toggle(field), onSortUpdated(field, state.get(field))),
					},
					m(
						"span.is-relative",
						isSort ?
							justifyRight ? [i("angle-right", { class: sortDir }), label]
							:	[label, i("angle-right", { class: sortDir })]
						:	label,
					),
				)
			},
		)
