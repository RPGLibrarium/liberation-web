import {API,PAGE,ROUTER,checkScope,nestWrap} from './base.js';
import {loadTitles} from './titles.js';
import {registerEditEvents} from './table.js';

PAGE('systems', 'Systeme', 'rpg_systems_list', 'librarium', undefined, onDisplayRpgSystems);
PAGE('system', 'System', 'rpg_system', 'librarium');

ROUTER
  .on('systems', ()=>PAGE._RENDER(enrichData(nestWrap('rpgsystems', loadRpgSystems)), PAGE.systems))
  //.on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystem), PAGE.system, args));
  .on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystemWithTitles), PAGE.system, args));

function canEditSystems() {
  return checkScope('librarian:rpgsystems:modify');
}

function enrichData(fn) {
  return _ => fn().then(data => {
    data._editable = canEditSystems();
    return data;
  })
}

function onDisplayRpgSystems(pageNode) {
  let systemsTable = pageNode.querySelector('table.systems');
  if (systemsTable) {
    registerEditEvents({
      table: systemsTable,
      canEdit: canEditSystems,
      onUpdate: updateRpgSystem,
    });

    systemsTable.querySelectorAll('tr[data-rowId]').forEach(row => {
      row.addEventListener('click', event => {
//        if(editing || event.target.matches('a,button,select,input')){ return; }
        if(event.target.matches('a,button,select,input')){ return; }
        event.preventDefault()
        let systemid = row.getAttribute('data-rowId');
        ROUTER.navigate('systems/' + encodeURIComponent(systemid));
      });
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
