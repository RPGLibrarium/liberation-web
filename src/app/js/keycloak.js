import {WEB_ROOT_PATH, API} from './base.js';
// const KC_CONF_LOCATION = '../keycloak.json';
const KC_REFRESH_INTERVAL = 5; // seconds -> how often it is checked
const KC_REFRESH_THRESHOLD = 10; // seconds -> remaining time which causes refresh
const STORAGE_KEY_KC_TOKEN = 'lastKcToken';
const STORAGE_KEY_KC_ID_TOKEN = 'lastKcIdToken';
const STORAGE_KEY_KC_REFRESH_TOKEN = 'lastKcRefreshToken';

export let KEYCLOAK = null;
let KEYCLOAK_UPDATE_INTERVAL = null;
const STORAGE = window.localStorage;

function addKeycloakScript(keycloakUrl) {
  let scriptLocation = `${keycloakUrl}/js/keycloak.js`;
  let scriptNode = document.createElement('script');
  let keycloakLoaded = new Promise((resolve, reject) => {
    scriptNode.addEventListener('error', errorEvt => {
      console.error('error loading keycloak script', errorEvt);
      reject();
    });
    scriptNode.addEventListener('load', loadEvt => {
      console.debug('keycloak script loaded!');
      resolve();
    });
  });
  scriptNode.src = scriptLocation;
  scriptNode.async = true;
  document.querySelector('head').appendChild(scriptNode);
  return keycloakLoaded;
}


export async function initKeycloak(keycloakConfigLocation) {
  console.debug("Loading Keycloak");
  let config = await API.get(new URL(`${WEB_ROOT_PATH}/${keycloakConfigLocation}`, location.href))
      .then(res => res.json())
      .catch(e => Promise.reject({message: 'Fetching Keycloak config failed.', error: e}));
  if(typeof Keycloak !== 'undefined' && Keycloak ) console.debug("Keycloak script already loaded.")
  else await addKeycloakScript(config['auth-server-url'])
      .catch( e => Promise.reject({message: 'Loading Keycloak script failed.', error: e}));

  if(KEYCLOAK) {
    console.debug("Keycloak already initialized.");
    return;
  }
  let keycloak = new Keycloak({
      url: config['auth-server-url'],
      clientId: config.resource,
      ...config,
    });

  let cachedCredentials = {};
  if (STORAGE) {
    let addIfExists = (initKey, storageKey) => {
      const val = STORAGE.getItem(storageKey) ?? undefined;
      if (val !== undefined) cachedCredentials[initKey] = val;
    };
    addIfExists('token', STORAGE_KEY_KC_TOKEN);
    addIfExists('idToken', STORAGE_KEY_KC_ID_TOKEN);
    addIfExists('refreshToken', STORAGE_KEY_KC_REFRESH_TOKEN);
  }

  await keycloak.init({
    ...cachedCredentials,
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: new URL('./silent-check-sso.html', location.href).toString(),
    silentCheckSsoFallback: true,
    enableLogging: true,
  }).then(() => KEYCLOAK = keycloak)
    .catch(e => Promise.reject({message: 'Failed initialising Keycloak.', error: e}));

  updateKeycloakState();
}

function updateKeycloakState(){
  if (KEYCLOAK && KEYCLOAK.authenticated && STORAGE) {
    STORAGE.setItem(STORAGE_KEY_KC_TOKEN, KEYCLOAK.token);
    STORAGE.setItem(STORAGE_KEY_KC_ID_TOKEN, KEYCLOAK.idToken);
    STORAGE.setItem(STORAGE_KEY_KC_REFRESH_TOKEN, KEYCLOAK.refreshToken);
  }
  if(KEYCLOAK && KEYCLOAK.authenticated && KEYCLOAK_UPDATE_INTERVAL === null){
    KEYCLOAK_UPDATE_INTERVAL = setInterval(refreshToken, KC_REFRESH_INTERVAL * 1000)
  } else if(!(KEYCLOAK && KEYCLOAK.authenticated) && KEYCLOAK_UPDATE_INTERVAL !== null){
    console.warn('not logged in anymore ...');
    clearInterval(KEYCLOAK_UPDATE_INTERVAL);
    KEYCLOAK_UPDATE_INTERVAL = null;
  }
}

function refreshToken() {
  if(!KEYCLOAK) return console.warn("Keycloak, not set");
  KEYCLOAK.updateToken(KC_REFRESH_THRESHOLD)
    .then(refreshed => {
      if(refreshed){
        console.debug('keycloak token refreshed');
        updateKeycloakState();
      }
    })
    .catch(err => {
        console.err('refreshing token failed:', err);
        updateKeycloakState();
    });
}

export function login() {
    KEYCLOAK.login({scope: 'account:modify aristocrat:accounts:modify aristocrat:accounts:read aristocrat:books:modify aristocrat:books:read aristocrat:guilds:modify librarian:rpgsystems:modify librarian:titles:modify'});
}

export function logout() {
    if (STORAGE) {
      STORAGE.removeItem(STORAGE_KEY_KC_TOKEN);
      STORAGE.removeItem(STORAGE_KEY_KC_ID_TOKEN);
      STORAGE.removeItem(STORAGE_KEY_KC_REFRESH_TOKEN);
    }
    KEYCLOAK.logout();
}

function checkRoles(role) {
  return KEYCLOAK && KEYCLOAK.authenticated && KEYCLOAK.tokenParsed.roles && (KEYCLOAK.tokenParsed.roles.includes(role) || KEYCLOAK.tokenParsed.roles.includes('admin'));
}

export function checkScope(scope) {
  return KEYCLOAK && KEYCLOAK.authenticated && KEYCLOAK.tokenParsed.scope.split(' ').includes(scope);
}
