import {API,PAGE,ROUTER} from './base.js';

PAGE('allGuilds', 'Alle Gilden', 'guilds_list', 'aristocracy');
ROUTER
  .on('allGuilds', ()=>PAGE._RENDER(loadPageData,PAGE.allGuilds));

async function loadPageData() {
  let guilds = await loadGuilds();
  console.debug(guilds);

  let table = {
    editable: false,
    class: 'guilds',
    header: ['Name', 'Adresse', 'Kontakt'],
    rows: guilds.map((guild) => ({columns: [
      {columnName: 'name', columnValue: guild.name},
      {columnName: 'address', columnValue: guild.address},
      {columnName: 'contact_by_account_id', columnValue: guild.contact_by_account_id},
    ]}))
  };

  return { tables: { guilds: table, } };
}

export function loadGuilds() {
  return API.get('guilds')
    .then(r => r.json());
}