import {API,PAGE,ROUTER} from './base.js';

PAGE('allbooks', 'Alle Bücher', undefined, 9, PAGE._CONDITIONALS.onAristocrat);

ROUTER
  .on('allbooks', ()=>PAGE._RENDER(()=>Promise.resolve({}),PAGE.allbooks));



export function addBook(args) {
  return API({
      method: 'POST',
      url: '/books',
      data: args.book,
  }).then(stuff => stuff.data);
}
