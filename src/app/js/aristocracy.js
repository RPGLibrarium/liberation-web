import {API,PAGE,ROUTER,nestWrap} from './base.js';
import {addRpgSystem,loadRpgSystems} from './rpgsystems.js';
import {addTitle} from './titles.js';

PAGE('aristocracy', 'Aristokratie', 'peaks_of_aristocracy', 42, PAGE._CONDITIONALS.onAristocrat, onDisplayAristocracy);

ROUTER
  //.on('aristocracy', ()=>PAGE._RENDER(()=>Promise.resolve({}),PAGE.aristocracy));
  .on('aristocracy', ()=>PAGE._RENDER(nestWrap('rpgsystems', loadRpgSystems),PAGE.aristocracy));

function onDisplayAristocracy(pageNode){
  // title form
  let titleForm = pageNode.querySelector('#postTitle');
  let titleMessage = titleForm.querySelector('table + .message');
  let titleInputs = {
    system: titleForm.querySelector('#fTitleRpgsystem'),
    name: titleForm.querySelector('#fTitleName'),
    language: titleForm.querySelector('#fTitleLanguage'),
    publisher: titleForm.querySelector('#fTitlePublisher'),
    year: titleForm.querySelector('#fTitleYear'),
  };
  titleForm.addEventListener('submit', evt=>{
    console.debug('!system form submit', evt);
    evt.preventDefault();
    addTitle({title:{
      rpg_system_id: Number(titleInputs.system.value),
      name: titleInputs.name.value,
      language: titleInputs.language.value,
      publisher: titleInputs.publisher.value,
      year: Number(titleInputs.year.value),
      coverimage: '',
    }})
    .then(title=>{
      console.debug('added title', title);
      titleForm.reset();
      titleMessage.classList.remove('error');
      titleMessage.classList.add('ok');
      titleMessage.innerText = 'Titel hinzugefügt!';
    })
    .catch(err=>{
      console.error('adding title failed', err);
      titleMessage.classList.remove('ok');
      titleMessage.classList.add('error');
      titleMessage.innerText = `Fehler: ${err}`;
    })
  });

  // rpg system form
  let systemForm = pageNode.querySelector('#postRpgsystem');
  let systemMessage = systemForm.querySelector('table + .message');
  let systemInputs = {
    name: systemForm.querySelector('#fRpgName'),
    shortname: systemForm.querySelector('#fRpgShort'),
  };
  systemForm.addEventListener('submit', evt=>{
    console.debug('!system form submit', evt);
    evt.preventDefault();
    addRpgSystem({system:{
      name: systemInputs.name.value,
      shortname: systemInputs.shortname.value,
    }})
    .then(system=>{
      console.debug('added system', system);
      systemForm.reset();
      systemMessage.classList.remove('error');
      systemMessage.classList.add('ok');
      systemMessage.innerText = 'System hinzugefügt!';

      // in dropdown einfügen
      let optionEl = document.createElement('option');
      optionEl.value = system.id;
      optionEl.innerText = (system.shortname?`[${system.shortname}] `:'') + system.name;
      titleInputs.system.appendChild(optionEl);
      optionEl.selected = true;
    })
    .catch(err=>{
      console.error('adding system failed', err);
      systemMessage.classList.remove('ok');
      systemMessage.classList.add('error');
      systemMessage.innerText = `Fehler: ${err}`;
    })
  });
}
