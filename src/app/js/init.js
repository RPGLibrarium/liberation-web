import {loadTemplates, API, TEMPLATES, ROUTER} from './base.js';
import {initKeycloak} from './keycloak.js';
import * as DIALOGUES from './dialogues.js';

// ########
// CONFIG #
// ########
const WEB_ROOT_PATH = '..';
const CONFIG_LOCATION = 'config.json';
export let CONFIG = null;

function loadConfig() {
  return API.get(`${WEB_ROOT_PATH}/${CONFIG_LOCATION}`)
    .then(r=>r.json())
    .catch(e => {
      console.error('loading config failed! ', e);
      return Promise.reject('error loading config');
    });
}

const TEMPLATE_NAMES = [
    'nav_bar',
    'profile_details',
    'table',
    'page_librarium',
    'rpg_systems_list',
    'titles_list',
    'books_list',
    'accounts_list',
    'guilds_list',
    'peaks_of_aristocracy',
    'rpg_system',
];

export async function init() {
  document.querySelector(':root').classList.add('loading');
  const templatesPromise = loadTemplates(TEMPLATE_NAMES);
  const configPromise = loadConfig()
    .then(conf => CONFIG = conf);
  const keycloakPromise = configPromise.then((config) => initKeycloak(config.keycloakConfigLocation)
    .catch(e => console.error(e))
  );
  await Promise.all([templatesPromise, configPromise, keycloakPromise]);
  document.querySelector(':root').classList.remove('loading');
  ROUTER.resolve();
}