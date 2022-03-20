import {API,PAGE,ROUTER, nestWrap} from './base.js';
import {loadRpgSystems} from './rpgsystems.js';

PAGE('titles', 'Titel', 'titles_list', 'librarium');

ROUTER
  .on('titles', ()=>PAGE._RENDER(nestWrap('titles', loadTitlesWithSystem), PAGE.titles));

export function loadTitles() {
  return API.get('titles')
    .then(r => r.json());
}

export function addTitle({title}) {
  return API.post('titles', { data: title })
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
