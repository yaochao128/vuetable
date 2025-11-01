<template></template>

<script lang="ts">
import { defineComponent, getCurrentInstance, inject, onBeforeUnmount, reactive, watchEffect } from 'vue';
import type { Alignment, TableColumnInternal, TableProvide } from './tableContext';
import { tableInjectionKey } from './tableContext';

const alignmentValues: Alignment[] = ['left', 'center', 'right'];

export default defineComponent({
  name: 'PmTableColumn',
  props: {
    label: {
      type: String,
      default: undefined,
    },
    prop: {
      type: String,
      default: undefined,
    },
    width: {
      type: [String, Number],
      default: undefined,
    },
    minWidth: {
      type: [String, Number],
      default: undefined,
    },
    align: {
      type: String as () => Alignment,
      default: undefined,
      validator: (value: Alignment) => (value ? alignmentValues.includes(value) : true),
    },
    headerAlign: {
      type: String as () => Alignment,
      default: undefined,
      validator: (value: Alignment) => (value ? alignmentValues.includes(value) : true),
    },
    sortable: {
      type: Boolean,
      default: false,
    },
    formatter: {
      type: Function as unknown as () => ((row: any, value: any) => any),
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const table = inject<TableProvide | null>(tableInjectionKey, null);

    if (!table) {
      console.warn('[PmTableColumn] must be used inside PmTable.');
    }

    const instance = getCurrentInstance();
    const column = reactive<TableColumnInternal>({
      id: instance?.uid ?? Math.round(Math.random() * 100000),
      label: props.label,
      prop: props.prop,
      width: props.width,
      minWidth: props.minWidth,
      align: props.align,
      headerAlign: props.headerAlign,
      sortable: props.sortable,
      formatter: props.formatter,
      slots: {
        header: slots.header,
        default: slots.default,
      },
    });

    table?.registerColumn(column);

    watchEffect(() => {
      column.label = props.label;
      column.prop = props.prop;
      column.width = props.width;
      column.minWidth = props.minWidth;
      column.align = props.align;
      column.headerAlign = props.headerAlign;
      column.sortable = !!props.sortable;
      column.formatter = props.formatter;
      column.slots = {
        header: slots.header,
        default: slots.default,
      };
    });

    onBeforeUnmount(() => {
      table?.unregisterColumn(column.id);
    });

    return () => null;
  },
});
</script>
