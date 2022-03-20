import {API,PAGE,ROUTER,nestWrap} from './base.js';
import {loadTitles} from './titles.js';

PAGE('systems', 'Systeme', 'rpg_systems_list', 'librarium');
PAGE('system', 'System', 'rpg_system', 'librarium');

ROUTER
  .on('systems', ()=>PAGE._RENDER(nestWrap('rpgsystems', loadRpgSystems), PAGE.systems))
  //.on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystem), PAGE.system, args));
  .on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystemWithTitles), PAGE.system, args));

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

export function updateRpgSystem({system}) {
  return API.put('rpgsystems', { data: system })
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
