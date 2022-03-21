import {API,PAGE,ROUTER} from './base.js';

PAGE('allBooks', 'Aristokratie', 'books_list', 'aristocracy');
ROUTER
  .on('allBooks', ()=>PAGE._RENDER(loadPageData,PAGE.allBooks));

async function loadPageData() {
  let books = await loadBooks();
  console.debug(books);

  let table = {
    editable: false,
    class: 'books',
    header: ['#Inv', 'Titel', 'System', 'Eigentümer', 'Zustand'],
    rows: books.map((book) => ({columns: [
      {columnName: 'external_inventory_id', columnValue: book.external_inventory_id},
      {columnName: 'title', columnValue: book.title.name},
      {columnName: 'system', columnValue: book.title.rpg_system.name},
      {columnName: 'owner', columnValue: `${book.owner.type} ${book.owner.id}`},
      {columnName: 'quality', columnValue: book.quality},
    ]}))
  };

  return { tables: { books: table, } };
}

export function loadBooks() {
  return API.get('books?recursive=true')
    .then(r => r.json());
}

export function addBook({book}) {
  return API.post( '/books', {data: book})
    .then(r => r.json());
}