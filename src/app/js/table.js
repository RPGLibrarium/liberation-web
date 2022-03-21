// The table must have the class `editable`
// Rows must have the attribute `data-rowId`
// Input elements must have the class `value-form` and the `name` attribute must match the fieldname.
// Display elements must have the class `value-text` and the `data-name` attribute must match the fieldname.
// Buttons must have the class `rowbutton` and one of the following values: `edit`, `delete`, `save`, `modify`.
const editableClass = 'editable';
const rowIdAttribute = 'data-rowId';
const rowButtonClass = 'rowbutton';
const inputClass = 'value-form';
const textClass = 'value-text';

//TODO: this feels like OOP. Perhaps there is a more idiomatic way in JS.
export function createTable(cls, header, data, editable) {
  let table = {
    editable: editable,
    class: cls,
    header: header,
  };
  table.rows = data.map((row) => ({
      //TODO: variable identifier
      id: row.id,
      columns: Object.entries(row)
        .filter(([k, v]) => k != 'id')
        .map(([k, v]) => ({columnName: k, columnValue: v})),
    }));
  return table;
}

export function registerTableEvents({
    table,
    canEdit = () => true, 
    onRowDelete = () => {},
    onRowUpdate = (rowId, values) => {},
    onRowClick = () => {},
}) {
  table.querySelectorAll(`tr[${rowIdAttribute}]`).forEach(row => {
    let editing = false;
    if (table.matches(`.${editableClass}`) && canEdit()) {
       let rowInputs = {};
       row.querySelectorAll(`input:not([type=submit]).${inputClass}, select.${inputClass}`)
         .forEach(el => rowInputs[el.name] = el);
       let rowValues = {};
       row.querySelectorAll(`.${textClass}[data-name]`)
         .forEach(el =>rowValues[el.getAttribute('data-name')] = el );
       function abortEditing() {
         if (!editing) return;
         editing = false;
         row.classList.remove('editing');
         // Reset inputs
         Object.values(rowInputs).forEach(input => input.value = input.getAttribute('value'));
       };

      row.querySelector(`.${rowButtonClass}[value=edit]`)
        .addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          if (editing) return;
          editing = true
          row.classList.add('editing')
        });

      row.querySelector(`.${rowButtonClass}[value=delete]`)
        .addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          onRowDelete()
          // TODO: delete Row from view
            .catch(err => {
              console.error('deleting row failed', err);
              //TODO: nicer error message
              alert('Fehler');
            });
        });

      row.querySelector(`.${rowButtonClass}[value=save]`)
        .addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          let rowId = Number(row.getAttribute(rowIdAttribute));
          let values = {};
          Object.entries(rowInputs).forEach(([k, input]) => {
              values[k] = input.value !== '' ? input.value : null;
          });
          onRowUpdate(rowId, values)
            .then(response => {
              Object.entries(rowValues).forEach(([k, value]) => {
                let newValue = response[k] !== null ? response[k] : '';
                value.textContent = newValue;
              });
              Object.entries(rowInputs).forEach(([k, input]) => {
                let newValue = response[k] !== null ? response[k] : '';
                input.setAttribute('value', newValue)
              });
              abortEditing();
            }).catch(err => {
              console.error('updating row failed', err);
              //TODO: nicer error message
              alert('Fehler');
            });
        });

      row.querySelector(`.${rowButtonClass}[value=abort]`)
        .addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          abortEditing();
        });
    }; // if

    row.addEventListener('click', event => {
      if(editing || event.target.matches('a,button,select,input')){ return; }
      event.preventDefault();
      event.stopPropagation();
      let rowId = row.getAttribute(`${rowIdAttribute}`);
      onRowClick(rowId);
    });
  }); // for each
} // function
