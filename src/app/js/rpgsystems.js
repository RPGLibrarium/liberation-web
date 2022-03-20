import {API,PAGE,ROUTER,nestWrap} from './base.js';
import {loadTitles} from './titles.js';

PAGE('systems', 'Systeme', 'rpg_systems_list', 'librarium', undefined, onDisplayRpgSystems);
PAGE('system', 'System', 'rpg_system', 'librarium');

ROUTER
  .on('systems', ()=>PAGE._RENDER(nestWrap('rpgsystems', loadRpgSystems), PAGE.systems))
  //.on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystem), PAGE.system, args));
  .on('systems/:id', args=>PAGE._RENDER(nestWrap('rpgsystem', loadRpgSystemWithTitles), PAGE.system, args));

function onDisplayRpgSystems(pageNode) {
  pageNode.querySelectorAll('.systems tr[data-rpgsystemid]').forEach((row) => {
    let editing = false;
    let rowInputs = {};
    row.querySelectorAll('input:not([type=submit]), select').forEach(el => rowInputs[el.name] = el);
    let rowValues = {};
    row.querySelectorAll('.value-text[data-name]').forEach(el => rowValues[el.getAttribute('data-name')] = el);

    function abortEditing() {
      if (!editing) return;
      editing = false
      row.classList.remove('editing')
      // Reset inputs
      Object.values(rowInputs).forEach(input => {
        input.value = input.getAttribute('value')
      });
    }

    row.querySelector('.rowbutton[value=edit]')
      .addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation();
        if (editing) return;
        editing = true
        row.classList.add('editing')
      });
    row.querySelector('.rowbutton[value=delete]')
      .addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation();
        // TODO: edit code here
      });
    row.querySelector('.rowbutton[value=save]')
      .addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation();
        updateRpgSystem({id: Number(row.getAttribute('data-rpgsystemid')), system:{
          name: rowInputs.name.value,
          shortname: rowInputs.shortname.value !== "" ? rowInputs.shortname.value : null,
        }}).then(system => {
          console.debug('updated rpgsystem', system);
          rowValues.name.textContent = system.name;
          rowValues.shortname.textContent = system.shortname;
          rowInputs.name.setAttribute('value', system.name);
          rowInputs.shortname.setAttribute('value', system.shortname);
          abortEditing();
        }).catch(err => {
          console.error('updating rpgsystem failed', err);
          //TODO: nicer error message
          alert(`Fehler ${err}`);
        })
      });
    row.querySelector('.rowbutton[value=abort]')
      .addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        abortEditing();
      });
    row.addEventListener('click', event => {
      if(editing || event.target.matches('a,button,select,input')){ return; }
      event.preventDefault()
      let systemid = row.getAttribute('data-rpgsystemid');
      ROUTER.navigate('systems/' + encodeURIComponent(systemid));
    });
  });
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

export function updateRpgSystem({id, system}) {
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
