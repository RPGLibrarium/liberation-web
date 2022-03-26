// 'use strict';
import {API, PAGE, keycloak, logout, login, MAGIC, ROUTER, TEMPLATES} from './base.js';
import './accounts.js';
import './aristocracy.js';
import './books.js';
import './collection.js';
import './guilds.js';
import './librarium.js';
import './profile.js';
import './rpgsystems.js';
import './titles.js';

// useful for debugging
window.keycloak = () => keycloak;

const initialLoadingPromise = loadTemplates();

function loadTemplates(){
  const loadTpl = name => API.get(new URL(`templates/${name}.mustache`, location.href))
    .then(r => r.text())
    .then(data => {
      TEMPLATES[name] = data;
      Mustache.parse(TEMPLATES[name]);
    });
  return Promise.all([
    loadTpl('accounts_list'),
    loadTpl('books_list'),
    loadTpl('dialogue'),
    loadTpl('guilds_list'),
    loadTpl('nav_bar'),
    loadTpl('page_librarium'),
    loadTpl('peaks_of_aristocracy'),
    loadTpl('profile_details'),
    loadTpl('rpg_system'),
    loadTpl('rpg_systems_list'),
    loadTpl('table'),
    loadTpl('test'),
    loadTpl('titles_list'),
  ])
    .catch(err => console.error('something went wrong (fetching templates)', err));
}

// #####################
// ADD EVENT LISTENERS #
// #####################

/*
 * Resolve router after loading the initial page structure and templates
 */
document.addEventListener("DOMContentLoaded", ()=>{
  // loadKeycloak();
  MAGIC(initialLoadingPromise, ()=>ROUTER.resolve());
});

document.querySelector(':root').addEventListener('click', e=>{
  if(e.target.matches('nav a[data-pageId=login]')){
    e.preventDefault();
    console.info('You pretend to belong to us? Prove it!');
    login();
    return;
  }
  if(e.target.matches('nav a[data-pageId=logout]')){
    e.preventDefault();
    console.info('You don\'t like us anymore? Then let us alone!');
    logout();
    return;
  }
});
