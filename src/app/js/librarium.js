import {API,PAGE,ROUTER} from './base.js';

PAGE('librarium', 'Librarium', 'page_librarium', 0);

ROUTER
  //.on('librarium', ()=>{console.debug("Here");
  //  ROUTER.navigate('systems')});
  .on('librarium', ()=>PAGE._RENDER(()=>Promise.resolve({}), PAGE.librarium))
