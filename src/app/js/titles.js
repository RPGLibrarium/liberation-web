import {API,PAGE,ROUTER,checkScope} from './base.js';
import {loadRpgSystems} from './rpgsystems.js';
import {registerTableEvents} from './table.js';

PAGE('titles', 'Titel', 'titles_list', 'librarium', undefined, onDisplayTitles);
PAGE('allTitles', 'Alle Titel', 'titles_list', 'aristocracy', onDisplayTitles);

ROUTER
  .on('titles', ()=>PAGE._RENDER(loadPageData, PAGE.titles))
  .on('allTitles', ()=>PAGE._RENDER(loadPageData, PAGE.allTitles));

async function loadPageData() {
  let titles = await loadTitlesWithSystem();
  let rpgsystems = await loadRpgSystems();
  let options = rpgsystems.map(system => ({id: system.id, tag: system.shortname, text: system.name}));

  let table = {
    editable: canEditTitles(),
    class: 'titles',
    header: ['Titel', 'System', 'Sprache', 'Verlach', 'Jahr'],
    rows: titles.map((title) => ({columns: [
      {columnName: 'name', columnValue: title.name},
      {
        columnName: 'system',
        columnValue: title.system.shortname !== null ? title.system.shortname : title.system.name,
        columnTitle: title.system.shortname !== null ? title.system.name : undefined,
        columnOptions: options,
      },
      {columnName: 'language', columnValue: title.language},
      {columnName: 'publisher', columnValue: title.publisher},
      {columnName: 'year', columnValue: title.year, columnType: 'number'},
    ]}))
  };
  console.debug(table);
  return { tables: { titles: table, } };
}

function canEditTitles() {
  return checkScope('librarian:titles:modify');
}

function onDisplayTitles(pageNode) {
  let titlesTable = pageNode.querySelector('table.titles');
  if (titlesTable) {
    registerTableEvents({
      table: titlesTable,
      canEdit: canEditTitles,
      onRowUpdate: async (id, obj) => {
        console.debug(obj);
        return obj
      }
    });
  };
}

export function loadTitles() {
  return API.get('titles')
    .then(r => r.json());
}

export function addTitle({title}) {
  return API.post('titles', { data: title })
    .then(r => r.json());
}

export function updateTitle(id, title) {
  return API.put('titles/'+ encodeURIComponent(id), { data: title})
    .then(r => r.json());
}

//////////////

function loadTitlesWithSystem() {
  return Promise.all([loadRpgSystems(), loadTitles()])
    .then(([systems, titles]) => {
      let sysObj = {};
      systems.forEach(s => sysObj[s.id || s.system_id || s.rpg_system_id || null] = s);
      return titles.map(t => ({...t, system: t.system || t.rpg_system || sysObj[t.system_id || t.rpg_system_id || t.rpg_system_by_id] || null}));
    });
}
