import {API,PAGE,ROUTER} from './base.js';

PAGE('allbooks', 'Alle Bücher', undefined, 9, PAGE._CONDITIONALS.onAristocrat);

ROUTER
  .on('allbooks', ()=>PAGE._RENDER(()=>Promise.resolve({}),PAGE.allbooks));

export function addBook({book}) {
  return API.post( '/books', {data: book})
    .then(r => r.json());
}
