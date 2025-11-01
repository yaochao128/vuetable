<template>
  <div :class="tableClasses">
    <div class="pm-table__container">
      <table class="pm-table__inner">
        <colgroup v-if="columns.length">
          <col v-for="column in columns" :key="column.id" :style="getColStyle(column)" />
        </colgroup>
        <thead class="pm-table__header">
          <tr>
            <th
              v-for="column in columns"
              :key="`header-${column.id}`"
              :class="getHeaderCellClasses(column)"
              @click="handleSort(column)"
            >
              <div class="pm-table__cell">
                <RenderSlot
                  v-if="column.slots.header"
                  :slot-fn="column.slots.header"
                  :scope="{ column }"
                />
                <span v-else>{{ column.label }}</span>
                <span v-if="column.sortable" class="pm-table__sort">
                  <span
                    class="pm-table__sort-icon pm-table__sort-icon--asc"
                    :class="{ 'is-active': isSorted(column, 'asc') }"
                  ></span>
                  <span
                    class="pm-table__sort-icon pm-table__sort-icon--desc"
                    :class="{ 'is-active': isSorted(column, 'desc') }"
                  ></span>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody v-if="hasData" class="pm-table__body">
          <tr
            v-for="(row, rowIndex) in sortedData"
            :key="getRowIdentity(row, rowIndex)"
            class="pm-table__row"
          >
            <td
              v-for="column in columns"
              :key="`row-${rowIndex}-col-${column.id}`"
              :class="getBodyCellClasses(column)"
            >
              <div class="pm-table__cell">
                <RenderSlot
                  v-if="column.slots.default"
                  :slot-fn="column.slots.default"
                  :scope="{ row, column, value: getCellValue(row, column), index: rowIndex }"
                />
                <span v-else>{{ getDisplayValue(row, column) }}</span>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else class="pm-table__body">
          <tr class="pm-table__empty-row">
            <td :colspan="Math.max(columns.length, 1)">
              <div class="pm-table__empty">暂无数据</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  provide,
  reactive,
  ref,
  type PropType,
  type Slot,
} from 'vue';
import type { Alignment, TableColumnInternal, TableProvide } from './tableContext';
import { tableInjectionKey } from './tableContext';

interface SortState {
  prop: string | null;
  order: 'asc' | 'desc' | null;
}

const alignmentClass = (align?: Alignment) => {
  switch (align) {
    case 'center':
      return 'is-center';
    case 'right':
      return 'is-right';
    default:
      return 'is-left';
  }
};

const normalizeWidth = (value?: string | number) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return typeof value === 'number' ? `${value}px` : String(value);
};

const compareValues = (a: any, b: any) => {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b));
};

const RenderSlot = defineComponent({
  name: 'PmRenderSlot',
  props: {
    slotFn: {
      type: Function as PropType<Slot | undefined>,
      default: undefined,
    },
    scope: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
  },
  setup(props) {
    return () => (props.slotFn ? props.slotFn(props.scope) : null);
  },
});

export default defineComponent({
  name: 'PmTable',
  components: {
    RenderSlot,
  },
  props: {
    data: {
      type: Array as PropType<Record<string, any>[]>,
      default: () => [],
    },
    stripe: {
      type: Boolean,
      default: false,
    },
    border: {
      type: Boolean,
      default: false,
    },
    rowKey: {
      type: String,
      default: undefined,
    },
  },
  emits: ['sort-change'],
  setup(props, { emit }) {
    const columns = ref<TableColumnInternal[]>([]);
    const sortState = reactive<SortState>({
      prop: null,
      order: null,
    });

    const registerColumn = (column: TableColumnInternal) => {
      columns.value.push(column);
    };

    const unregisterColumn = (id: number) => {
      const index = columns.value.findIndex((item) => item.id === id);
      if (index !== -1) {
        const [removed] = columns.value.splice(index, 1);
        if (removed && removed.prop && sortState.prop === removed.prop) {
          sortState.prop = null;
          sortState.order = null;
        }
      }
    };

    const tableContext: TableProvide = {
      registerColumn,
      unregisterColumn,
    };

    provide(tableInjectionKey, tableContext);

    const normalizedData = computed(() => (Array.isArray(props.data) ? props.data : []));

    const sortedData = computed(() => {
      if (!sortState.prop || !sortState.order) {
        return normalizedData.value.slice();
      }
      const column = columns.value.find((item) => item.prop === sortState.prop);
      if (!column) {
        return normalizedData.value.slice();
      }
      const sorted = normalizedData.value.slice().sort((a, b) => {
        const valueA = getCellValue(a, column);
        const valueB = getCellValue(b, column);
        const result = compareValues(valueA, valueB);
        return sortState.order === 'asc' ? result : -result;
      });
      return sorted;
    });

    const hasData = computed(() => sortedData.value.length > 0);

    const tableClasses = computed(() => [
      'pm-table',
      {
        'pm-table--border': props.border,
        'pm-table--stripe': props.stripe,
      },
    ]);

    const handleSort = (column: TableColumnInternal) => {
      if (!column.sortable || !column.prop) {
        return;
      }

      if (sortState.prop !== column.prop) {
        sortState.prop = column.prop;
        sortState.order = 'asc';
      } else {
        sortState.order = sortState.order === 'asc' ? 'desc' : 'asc';
      }

      emit('sort-change', {
        column,
        prop: sortState.prop,
        order: sortState.order,
      });
    };

    const getRowIdentity = (row: Record<string, any>, index: number) => {
      if (props.rowKey && row && row[props.rowKey] !== undefined && row[props.rowKey] !== null) {
        return row[props.rowKey];
      }
      return index;
    };

    const getColStyle = (column: TableColumnInternal) => {
      const style: Record<string, string> = {};
      const width = normalizeWidth(column.width);
      const minWidth = normalizeWidth(column.minWidth);
      if (width) {
        style.width = width;
      }
      if (minWidth) {
        style.minWidth = minWidth;
      }
      return style;
    };

    const getHeaderCellClasses = (column: TableColumnInternal) => {
      const classes = [
        'pm-table__header-cell',
        alignmentClass(column.headerAlign ?? column.align),
      ];
      if (column.sortable) {
        classes.push('is-sortable');
      }
      if (column.sortable && column.prop && column.prop === sortState.prop) {
        classes.push('is-sorted');
        if (sortState.order) {
          classes.push(`is-sorted-${sortState.order}`);
        }
      }
      return classes;
    };

    const getBodyCellClasses = (column: TableColumnInternal) => [
      'pm-table__body-cell',
      alignmentClass(column.align),
    ];

    const getCellValue = (row: Record<string, any>, column: TableColumnInternal) => {
      if (!column.prop) {
        return undefined;
      }
      const value = row ? row[column.prop] : undefined;
      return value;
    };

    const getDisplayValue = (row: Record<string, any>, column: TableColumnInternal) => {
      const value = getCellValue(row, column);
      if (column.formatter) {
        return column.formatter(row, value);
      }
      return value ?? '';
    };

    const isSorted = (column: TableColumnInternal, order: 'asc' | 'desc') =>
      column.sortable && column.prop === sortState.prop && sortState.order === order;

    return {
      columns,
      tableClasses,
      sortedData,
      hasData,
      handleSort,
      getRowIdentity,
      getColStyle,
      getHeaderCellClasses,
      getBodyCellClasses,
      getCellValue,
      getDisplayValue,
      isSorted,
    };
  },
});
</script>

<style scoped>
.pm-table {
  width: 100%;
  font-size: 14px;
  color: #2b3351;
  background-color: #ffffff;
}

.pm-table__container {
  width: 100%;
  overflow: hidden;
}

.pm-table--border {
  border: 1px solid #d8e0ee;
  border-radius: 6px;
}

.pm-table--border .pm-table__container {
  border-radius: inherit;
}

.pm-table__inner {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.pm-table__header th,
.pm-table__body td {
  padding: 12px 16px;
  font-weight: 400;
}

.pm-table__header th {
  color: #0b5fc2;
  font-weight: 600;
  background-color: #ffffff;
  border-bottom: 2px solid #0a6fe5;
  user-select: none;
}

.pm-table__header th:first-child,
.pm-table__body td:first-child {
  border-right: 1px solid #dde3f1;
}

.pm-table__body td {
  color: #2b3351;
  border-bottom: 1px solid #e4e9f4;
  background-color: #ffffff;
  transition: background-color 0.2s ease;
}

.pm-table:not(.pm-table--border) .pm-table__body tr:last-child td {
  border-bottom: none;
}

.pm-table--stripe .pm-table__body tr:nth-child(2n) td {
  background-color: #fafcff;
}

.pm-table__body tr:hover td {
  background-color: #f6faff;
}

.pm-table__cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  min-height: 20px;
}

.pm-table__header-cell.is-center,
.pm-table__body-cell.is-center {
  text-align: center;
}

.pm-table__header-cell.is-right,
.pm-table__body-cell.is-right {
  text-align: right;
}

.pm-table__header-cell.is-center .pm-table__cell,
.pm-table__body-cell.is-center .pm-table__cell {
  justify-content: center;
}

.pm-table__header-cell.is-right .pm-table__cell,
.pm-table__body-cell.is-right .pm-table__cell {
  justify-content: flex-end;
}

.pm-table__header-cell.is-sortable {
  cursor: pointer;
}

.pm-table__sort {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}

.pm-table__sort-icon {
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  opacity: 0.4;
}

.pm-table__sort-icon--asc {
  border-bottom: 6px solid #a7c2f3;
}

.pm-table__sort-icon--desc {
  border-top: 6px solid #a7c2f3;
}

.pm-table__sort-icon.is-active.pm-table__sort-icon--asc {
  border-bottom-color: #0a6fe5;
  opacity: 1;
}

.pm-table__sort-icon.is-active.pm-table__sort-icon--desc {
  border-top-color: #0a6fe5;
  opacity: 1;
}

.pm-table__empty-row td {
  padding: 32px 16px;
  text-align: center;
  color: #99a0b0;
}

.pm-table__empty {
  color: #a0a6b5;
  font-size: 14px;
}
</style>
