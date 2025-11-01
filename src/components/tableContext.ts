import type { InjectionKey, Slot } from 'vue';

type Alignment = 'left' | 'center' | 'right';

export interface ColumnSlots {
  header?: Slot;
  default?: Slot;
}

export interface TableColumnInternal {
  id: number;
  label?: string;
  prop?: string;
  width?: string | number;
  minWidth?: string | number;
  align?: Alignment;
  headerAlign?: Alignment;
  sortable: boolean;
  formatter?: (row: any, value: any) => any;
  slots: ColumnSlots;
}

export interface TableProvide {
  registerColumn: (column: TableColumnInternal) => void;
  unregisterColumn: (id: number) => void;
}

export const tableInjectionKey: InjectionKey<TableProvide> = Symbol('PmTable');
export type { Alignment };
