const WHOOSH_DURATION = 1000;
const execAfter = setTimeout;

// ###########################
// "(SEMI) GLOBAL" VARS INIT #
// ###########################

// some variables are used across several sections, so we should declare them on top ...
let CONFIG = null;
let PAGES = {};
const ALL_PAGES = [];
export let keycloak = null;


// #####
// API #
// #####
export const API = args => {
  const BASE_URL = CONFIG ? CONFIG.apiBaseUrl : location.href;
  let url = new URL(BASE_URL);
  switch (typeof args.url) {
    case 'undefined':
    case 'null':
      url = new URL(BASE_URL); break;
    case 'object':
      url = args.url; break;
    case 'function':
      url = args.url(); break;
    default:
      let relUrl = String(args.url);
      // make sure /something will see our base URL as "root element"
      if (relUrl.startsWith('/') && !relUrl.startsWith('//')) relUrl = '.' + relUrl;
      url = new URL(relUrl, BASE_URL);
  }

  let auth = undefined;
  if (keycloak && keycloak.authenticated){
    auth = `Bearer ${keycloak.token}`;
  }
  const defaultParams = {
    method: 'GET',
    headers: {
      ...(auth ? { Authorization: auth } : {}),
    },
    mode: 'cors',
    credentials: 'omit',
    cache: 'default',
    redirect: 'follow',
    referrer: 'Liberation Web',
  };

  let computedParams = {
    headers: { ...defaultParams.headers, ...args.headers },
  };
  // compat + ease of use
  if (args.body === undefined && typeof args.data === 'object') {
    computedParams.body = JSON.stringify(args.data);
    if ((args.headers||{})['Content-Type'] === undefined)
      computedParams.headers['Content-Type'] = 'application/json';
  }

  let statusFilter = code => code >= 200 && code < 400;
  switch (typeof args.statusFilter) {
    case 'undefined': break;
    case 'null':
      statusFilter = code => true; break;
    case 'boolean':
      statusFilter = code => args.statusFilter; break;
    case 'function':
      statusFilter = args.statusFilter; break;
    default:
      console.warn('bad value for statusFilter', args.statusFilter)
  }

  return fetch(url, {
    ...defaultParams,
    ...args,
    ...computedParams,
  })
    // compat ...
    .then(r => (Object.defineProperty(r, 'data', { get: () => r.json() }),r)) // TODO: autodetect based on content-type header?
    .then(r => statusFilter(r.status) ? r : Promise.reject({
      response: r,
      message: `response status code indicates a failed request: ${r.status}`,
    }));
};
Object.defineProperty(API, 'API_BASE_URL', { get: () => CONFIG ? CONFIG.apiBaseUrl : undefined });
API.get = (url, args=undefined) => API({ url, method: 'GET', ...(args||{}) });
API.post = (url, args=undefined) => API({ url, method: 'POST', ...(args||{}) });
API.put = (url, args=undefined) => API({ url, method: 'PUT', ...(args||{}) });
API.delete = (url, args=undefined) => API({ url, method: 'DELETE', ...(args||{}) });


// ########
// CONFIG #
// ########
const WEB_ROOT_PATH = '..';
const CONFIG_LOCATION = 'config.json';
let _configPromise = API.get(`${WEB_ROOT_PATH}/${CONFIG_LOCATION}`)
  .then(r=>r.json())
  .then(data => CONFIG = data)
  .catch(e => {
    console.error('loading config failed! ', e);
    return Promise.reject('error loading config');
  });


// #######
// PAGES #
// #######
export const TEMPLATES = {};
export const PAGE = (page, title, template, nav=undefined, conditional=undefined, onDisplay=undefined)=>{
  if(PAGES[page]) return;
  conditional = conditional || (()=>true);
  onDisplay = onDisplay || (()=>{});

  let obj = {page,title,template,conditional,onDisplay};
  switch (typeof nav){
    case 'number': // position in navigation bar -> this is a MASTER PAGE!
      if(!Number.isSafeInteger(nav)) console.warn(`oh no! nav looks like a number, but is evil!`, nav);
      else obj.navPos = nav;
      break;
    case 'string': obj.navActive = nav; break; // associated MASTER PAGE to highlight in nav bar for the current sub page
    case 'undefined': break; // TODO remove maybe ...
    default: console.warn(`welp, we've got problems. nav has bad type '${typeof nav}' ... `, nav);
  }
  console.debug(obj);
  PAGES[page] = obj;
  ALL_PAGES.push(obj); // pushing hard
};
PAGES = PAGE;
let NAV_ACTIVE = 'librarium'; //Sane default value, is overwritten later on
PAGES._CONDITIONALS = {
  onAuthenticated: ()=>keycloak && keycloak.authenticated,
  onNotAuthenticated: ()=> keycloak && !keycloak.authenticated,
  onAristocrat: ()=>checkScope('aristocrat:books:read')||checkScope('aristocrat:books:read'),
  onDev: ()=>checkRoles('developer'),
  onLibrarian: ()=>checkRoles('librarian'),
}


// ########
// ROUTER #
// ########
export const ROUTER = new Navigo(null, true, '#');

ROUTER
  .on(()=>ROUTER.navigate('librarium')); //Set landing page here!
ROUTER.notFound(()=>{
  // if there is nothing ... go back to the start page
  if (location.hash === '' || location.hash === '#' || location.hash.startsWith('#?')) {
    return ROUTER.navigate('librarium');
  }
  const page = ROUTER._lastRouteResolved;
  console.error('Whoopsie! Looks like 404 to me ...', page);
  // TODO: show a good 404 page!
});

// ######
// AUTH #
// ######
// const KC_CONF_LOCATION = '../keycloak.json';
const KC_REFRESH_INTERVAL = 5; // seconds -> how often it is checked
const KC_REFRESH_THRESHOLD = 10; // seconds -> remaining time which causes refresh

let keycloakUpdateInterval = null;

function loadKeycloak(waitForStuff, thenDoStuff) {
  console.debug("Loading keycloak")
  document.querySelector(':root').classList.add('loading');
  if(typeof Keycloak === 'undefined' || !Keycloak){
    API.get(new URL(`${WEB_ROOT_PATH}/${CONFIG.keycloakConfigLocation}`, location.href))
      .then(res => res.data)
      .then(conf => {
        let scriptLocation = `${conf['auth-server-url']}/js/keycloak.js`;
        let scriptNode = document.createElement('script');
        scriptNode.addEventListener('error', errorEvt => {
          console.error('error loading keycloak script', errorEvt)
          initWithoutKeycloak(waitForStuff, thenDoStuff);
        });
        scriptNode.addEventListener('load', loadEvt => {
          console.debug('keycloak script loaded!');
          initKeycloak(waitForStuff, thenDoStuff);
        });
        scriptNode.src = scriptLocation;
        scriptNode.async = true;
        document.querySelector('head').appendChild(scriptNode);
      })
      .catch(err => {
        console.error('Fetching Keycloak configuration failed!', err);
      })
  }
}

function initKeycloak(waitForStuff, thenDoStuff){
  if(!keycloak){
    console.debug("Init keycloak")
    // TODO the following seems to be easier than passing the conf object o_O ... we should be able to reuse it!
    keycloak = new Keycloak(`${WEB_ROOT_PATH}/${CONFIG.keycloakConfigLocation}`);
  }

  keycloak.init({
    onLoad: 'check-sso',
  })
  .success(()=>{
    waitForStuff.then(thenDoStuff);
    updateKeycloakState();
  })
  .error(err => {
    console.error('failed initialising keycloak', err);
    initWithoutKeycloak(waitForStuff, thenDoStuff);
  })
}

function initWithoutKeycloak(waitForStuff, thenDoStuff){
  waitForStuff.then(thenDoStuff);
}

function updateKeycloakState(){
  if(keycloak && keycloak.authenticated && keycloakUpdateInterval === null){
    keycloakUpdateInterval = setInterval(refreshToken, KC_REFRESH_INTERVAL * 1000)
  } else if(!(keycloak && keycloak.authenticated) && keycloakUpdateInterval !== null){
    clearInterval(keycloakUpdateInterval);
    keycloakUpdateInterval = null;
  }
}

function refreshToken() {
  if(!keycloak) return console.warn("Keycloak, not set");
  keycloak.updateToken(KC_REFRESH_THRESHOLD)
    .success(refreshed => {
      if(refreshed){
        console.debug('keycloak token refreshed');
        updateKeycloakState();
      }
    })
    .error(err => {
        console.err('refreshing token failed:', err);
        updateKeycloakState();
    });
}

function checkRoles(role) {
  return keycloak && keycloak.authenticated && keycloak.tokenParsed.roles && (keycloak.tokenParsed.roles.includes(role) || keycloak.tokenParsed.roles.includes('admin'));
}

function checkScope(scope) {
  return keycloak && keycloak.authenticated && keycloak.tokenParsed.scope.split(' ').includes(scope);
}

// #####################
// UI VOODOO FUNCTIONS #
// #####################
function renderPage(loadData, page, args={}) {
  if (!page.template) return ROUTER.navigate('librarium');
  const navPageActive = page.navActive !== undefined ? page.navActive : page.page;
  const root = document.querySelector(':root');
  //loadingScreen
  root.classList.add('loading');
  // query data
  loadData(args, true).then(data => {
    data = {
      _AUTHENTICATED: (keycloak || {}).authenticated || false,
      ...data,
    };
    // render data to template
    const rendered = Mustache.render(TEMPLATES[page.template], data);
    // generate page element
    let pageElement = document.createElement('div');
    pageElement.classList.add('page');
    pageElement.innerHTML = rendered;
    // store old pages
    const oldPages = document.querySelectorAll('main > .page');
    // ... add class "old" to these
    oldPages.forEach(e => e.classList.add('old'));
    // remove loading screen
    root.classList.remove('loading');
    // add new page to main element
    document.querySelector('main').appendChild(pageElement);
    // update navigation bar (maybe a new item is active now‽)
    NAV_ACTIVE = navPageActive;
    updateNavBar();
    page.onDisplay(pageElement, data);
    // remove old page elements after woosh animation
    execAfter(()=>oldPages.forEach(e => e.remove()), WHOOSH_DURATION);
  }).catch(e => {
    console.error('we got errœr', e);
    root.classList.remove('loading');
  });
}
PAGE._RENDER = renderPage;

function updateNavBar() {
  let navBarPagesTmp = ALL_PAGES
    .filter(p => p.navPos !== undefined)
    .filter(p => p.conditional())
    .sort((b,a) => b.navPos - a.navPos);
  let navBarPagesLeft = navBarPagesTmp
    .filter(p => p.navPos>=0);
  let navBarPageRight = navBarPagesTmp
    .filter(p => p.navPos<0);

  const newHtml = Mustache.render(TEMPLATES.nav_bar, {
    pagesLeft: NAV_ACTIVE ? navBarPagesLeft.map(p => {
      if (p.page === NAV_ACTIVE) {
        return {...p, class:['active']};
      }
      return p;
    }) : navBarPagesLeft,
    pagesRight: NAV_ACTIVE ? navBarPageRight.map(p => {
      if (p.page === NAV_ACTIVE) {
        return {...p, class:['active']};
      }
      return p;
    }) : navBarPageRight,
  });
  document.querySelector('nav.topnav').outerHTML = newHtml;
}


// #####################
// GENREAL MAGIC STUFF #
// #####################
export const MAGIC = (waitForStuff, thenDoStuff)=>{
  _configPromise.then(()=>loadKeycloak(waitForStuff, thenDoStuff));
};


// ###################
// UTILITY FUNCTIONS #
// ###################
export function nestWrap(property, fn) {
  return (...args) => fn(...args).then(data => ({[property]: data}));
}
