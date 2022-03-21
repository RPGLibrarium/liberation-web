import {API,PAGE,ROUTER,nestWrap} from './base.js';
import {addRpgSystem,loadRpgSystems} from './rpgsystems.js';
import {addTitle,loadTitles} from './titles.js';
import {addBook,loadBooks} from './books.js';
import {loadGuilds} from './guilds.js';
import {loadAccounts} from './accounts.js';

PAGE('aristocracy', 'Aristokratie', 'peaks_of_aristocracy', 42, PAGE._CONDITIONALS.onAristocrat, onDisplayAristocracy);

ROUTER
  .on('aristocracy', ()=>PAGE._RENDER(loadAristocracyPageData,PAGE.aristocracy))

function loadAristocracyPageData () {
  return Promise.all([loadRpgSystems(), loadTitles(), loadBooks(), loadGuilds(), loadAccounts()])
    .then(([systems, titles, books, guilds, accounts]) => {
      let sysObj = {};
      systems.forEach(s => sysObj[s.id || s.system_id || s.rpg_system_id || null] = s);
      let titlesObj = {}
      titles.forEach(t => {
        titlesObj[t.id || t.title_id] = t;
        t._system = sysObj[t.system_id || t.rpg_system_id || t.rpg_system_by_id] || {};
      });
      return {
        rpgsystems: systems,
        systemsById: sysObj,
        titles,
        titlesById: titlesObj,
        guilds,
        statistics: [ ['Bücher', books.length], ['Nutzer', accounts.length], ['Gilden', guilds.length] ]
      };
    });
}

function onDisplayAristocracy(pageNode, data){
  // book form
  let bookForm = pageNode.querySelector('#addBook');
  let bookMessage = bookForm.querySelector('.formTable + .message');
  let bookInputs = {};
  bookForm.querySelectorAll('input:not([type=submit]), select').forEach(el => bookInputs[el.name] = el);
  bookForm.addEventListener('submit', evt => {
    console.debug('!book form submit', evt);
    evt.preventDefault();
    addBook({book:{
      title_id: Number(bookInputs.title.value),
      owner: { type: 'guild', id: Number(bookInputs.guild.value) },
      quality: bookInputs.quality.value,
      external_inventory_id: Number(bookInputs.inventory.value),
    }})
    .then(book=>{
      console.debug('added book', book);
      //bookForm.reset();
      bookInputs.quality.value = '';
      bookInputs.inventory.value = undefined;
      bookMessage.classList.remove('error');
      bookMessage.classList.add('ok');
      bookMessage.innerText = `Buch hinzugefügt! (ID: ${book.id})`;
    })
    .catch(err=>{
      console.error('adding book failed', err);
      bookMessage.classList.remove('ok');
      bookMessage.classList.add('error');
      bookMessage.innerText = `Fehler: ${err}`;
    })

  });

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
    console.debug('!title form submit', evt);
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
      //titleForm.reset();
      titleInputs.name.value = '';
      titleInputs.year.value = 0;
      titleMessage.classList.remove('error');
      titleMessage.classList.add('ok');
      titleMessage.innerText = `Titel hinzugefügt! (ID: ${title.id})`;

      // in dropdown einfügen
      let optionEl = document.createElement('option');
      optionEl.value = title.id;
      optionEl.innerText = `${title.name} (${title.year}; ${(data.systemsById[title.rpg_system_id]||{}).name})`;
      bookInputs.title.appendChild(optionEl);
      optionEl.selected = true;
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
      systemMessage.innerText = `System hinzugefügt! (ID: ${system.id})`;

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
