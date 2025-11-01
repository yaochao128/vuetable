# vuetable

Custom Vue 3 table component that mimics the API of Element Plus `<el-table>` and `<el-table-column>` while providing a bespoke blue-themed design.

## Usage

```vue
<template>
  <PmTable :data="tableData" stripe border row-key="id">
    <PmTableColumn prop="level" label="星级" sortable min-width="120" />
    <PmTableColumn prop="status" label="设备运行状态" min-width="240">
      <template #default="{ value }">
        <span class="status-text">{{ value }}</span>
      </template>
    </PmTableColumn>
  </PmTable>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PmTable, PmTableColumn } from 'vuetable';

const tableData = ref([
  { id: 1, level: '五星', status: '主控分功能正常，自检通过，所有环境项限员异常。' },
  { id: 2, level: '四星', status: '主控分功能正常，自检通过，所有环境项限员异常。' },
]);
</script>
```

Refer to `src/components/PmTable.vue` for all supported props and slots.
