import {API,PAGE,ROUTER} from './base.js';
import {KEYCLOAK} from './keycloak.js';

PAGE('profile', 'Mein Profil', 'profile_details', -2, PAGE._CONDITIONALS.onAuthenticated);

PAGE('login', 'Login', undefined, -1, PAGE._CONDITIONALS.onNotAuthenticated);
PAGE('logout', 'Logout', undefined, -1, PAGE._CONDITIONALS.onAuthenticated);

ROUTER
  .on('profile', ()=>PAGE._RENDER(loadProfileData, PAGE.profile));

function loadMyAccountInfo() {
  return API.get('me')
    .then(r => r.json());
}

function loadProfileData() {
  if(!(keycloak && keycloak.authenticated)) return Promise.resolve({
    authenticated: false,
  });
  loadMyAccountInfo().then(d => console.debug("/me", d));
  const token = keycloak.tokenParsed;
  return Promise.resolve({
    authenticated: true,
    uid: token.sub,
    givenName: token.given_name,
    familyName: token.family_name,
    fullName: token.name,
    email: token.email,
    scopes: token.scope.split(' '),
  });
}
