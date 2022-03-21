// 'use strict';
import {API, PAGE, keycloak, logout, login, MAGIC, ROUTER, TEMPLATES} from './base.js';
import './librarium.js';
import './rpgsystems.js';
import './accounts.js';
import './guilds.js';
import './titles.js';
import './books.js';
import './collection.js';
import './aristocracy.js';
import './profile.js';

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
    loadTpl('nav_bar'),
    loadTpl('profile_details'),
    loadTpl('table'),
    loadTpl('page_librarium'),
    loadTpl('rpg_systems_list'),
    loadTpl('titles_list'),
    loadTpl('books_list'),
    loadTpl('accounts_list'),
    loadTpl('guilds_list'),
    loadTpl('peaks_of_aristocracy'),
    loadTpl('rpg_system'),
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
