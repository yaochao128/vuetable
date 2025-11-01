import type { App } from 'vue';
import PmTable from './components/PmTable.vue';
import PmTableColumn from './components/PmTableColumn.vue';

export { PmTable, PmTableColumn };

export default {
  install(app: App) {
    app.component(PmTable.name || 'PmTable', PmTable);
    app.component(PmTableColumn.name || 'PmTableColumn', PmTableColumn);
  },
};
