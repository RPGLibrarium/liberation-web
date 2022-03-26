// 'use strict';
import {init} from './init.js';
import {ROUTER} from './base.js';
import {logout, login, KEYCLOAK} from './keycloak.js';
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
window.keycloak = () => KEYCLOAK;

document.addEventListener("DOMContentLoaded", init);

document.querySelector(':root').addEventListener('click', e => {
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
