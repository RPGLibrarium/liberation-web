import {API,PAGE,ROUTER} from './base.js';

PAGE('allAccounts', 'Aristokratie', 'accounts_list', 'aristocracy');
ROUTER
  .on('allAccounts', ()=>PAGE._RENDER(loadPageData,PAGE.allAccounts));

async function loadPageData() {
  let accounts = await loadAccounts();
  console.debug(accounts);

  let table = {
    editable: false,
    class: 'accounts',
    header: ['Voller Name', 'Vornamen', 'Nachname', 'Email', 'UID', 'Activ'],
    rows: accounts.map((account) => ({columns: [
      {columnName: 'full_name', columnValue: account.full_name},
      {columnName: 'given_name', columnValue: account.given_name},
      {columnName: 'family_name', columnValue: account.family_name},
      {columnName: 'email', columnValue: account.email},
      {columnName: 'external_id', columnValue: account.external_id},
      {columnName: 'active', columnValue: account.active},
    ]}))
  };

  return { tables: { accounts: table, } };
}

export function loadAccounts() {
  return API.get('accounts')
    .then(r => r.json());
}
