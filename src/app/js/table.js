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

export function registerEditEvents({
    table,
    canEdit = () => true, 
    onDelete = () => {},
    onUpdate = () => {},
}) {
  if (table.matches(`.${editableClass}`) && canEdit()) {
    let editing = false;
    table.querySelectorAll(`tr[${rowIdAttribute}]`).forEach(row => {
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
          onDelete()
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
          console.debug(values);
          onUpdate(rowId, values)
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
    }); // for each
  }; // if
} // function
