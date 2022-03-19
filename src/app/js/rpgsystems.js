import {API,PAGE,ROUTER,nestWrap} from './base.js';
import {loadTitles} from './titles.js';

PAGE('systems', 'Systeme', 'rpg_systems_list', 'librarium');
PAGE('system', 'System', 'rpg_system', 'librarium');

ROUTER
  .on('systems', ()=>PAGE._RENDER(nestWrap('rpgsystems', loadRpgSystems), PAGE.systems))
  //.on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystem), PAGE.system, args));
  .on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystemWithTitles), PAGE.system, args));

export function loadRpgSystems() {
  return API({
      method: 'GET',
      url: '/rpgsystems',
  }).then(stuff => stuff.data);
}
export function loadRpgSystem(args) {
  return API({
      method: 'GET',
      url: '/rpgsystems/' + encodeURIComponent(args.id),
  }).then(stuff => stuff.data);
}

export function addRpgSystem(args) {
  return API({
      method: 'POST',
      url: '/rpgsystems',
      data: args.system,
  }).then(stuff => stuff.data);
}

////////////////////

export function loadRpgSystemWithTitles(args) {
  return Promise.all([
    loadRpgSystem(args),
    loadTitles()
      .then(titles => titles.filter(t => (t.system_id || t.rpg_system_id || t.rpg_system_by_id || null) == args.id))
  ]).then(([system, titles]) => ({...system, titles}));
}
