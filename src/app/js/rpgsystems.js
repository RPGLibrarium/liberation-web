import {API,PAGE,ROUTER, nestWrap} from './base.js';

PAGE('systems', 'Systeme', 'rpg_systems_list', 'librarium');
PAGE('system', 'System', 'rpg_system', 'librarium');

ROUTER
  .on('systems', ()=>PAGE._RENDER(nestWrap('rpgsystems', loadRpgSystems), PAGE.systems))
  .on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystem), PAGE.system, args));

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
