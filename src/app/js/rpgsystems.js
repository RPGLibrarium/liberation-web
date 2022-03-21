import {API,PAGE,ROUTER,checkScope,nestWrap} from './base.js';
import {loadTitles} from './titles.js';
import {registerTableEvents,createTable} from './table.js';

PAGE('systems', 'Systeme', 'rpg_systems_list', 'librarium', undefined, onDisplayRpgSystems);
PAGE('system', 'System', 'rpg_system', 'librarium');

ROUTER
  .on('systems', ()=>PAGE._RENDER(loadPageData, PAGE.systems))
  //.on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystem), PAGE.system, args));
  .on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystemWithTitles), PAGE.system, args));

async function loadPageData() {
  let rpgsystems = await loadRpgSystems();
  return {
    tables: {
      rpgsystems: createTable('systems', ['System', 'Kürzel'], rpgsystems, canEditSystems())
    }
  };
}

function canEditSystems() {
  return checkScope('librarian:rpgsystems:modify');
}

function onDisplayRpgSystems(pageNode) {
  let systemsTable = pageNode.querySelector('table.systems');
  if (systemsTable) {
    registerTableEvents({
      table: systemsTable,
      canEdit: canEditSystems,
      onRowUpdate: updateRpgSystem,
      onRowClick: (rowId) => ROUTER.navigate('systems/' + encodeURIComponent(rowId)),
    });

  };
}

export function loadRpgSystems() {
  return API.get('rpgsystems')
    .then(r => r.json());
}

export function loadRpgSystem({id}) {
  return API.get('rpgsystems/' + encodeURIComponent(id))
    .then(r => r.json());
}

export function addRpgSystem({system}) {
  return API.post('rpgsystems', { data: system })
    .then(r => r.json());
}

export function updateRpgSystem(id, system) {
  return API.put('rpgsystems/'+ encodeURIComponent(id), { data: system })
    .then(r => r.json());
}

////////////////////

export function loadRpgSystemWithTitles(args) {
  return Promise.all([
    loadRpgSystem(args),
    loadTitles()
      .then(titles => titles.filter(t => (t.system_id || t.rpg_system_id || t.rpg_system_by_id || null) == args.id))
  ]).then(([system, titles]) => ({...system, titles}));
}
