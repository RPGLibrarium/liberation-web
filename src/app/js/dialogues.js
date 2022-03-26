
let LIB = null;
let containerNode = null;
let dialogues = [];

class Dialogue extends EventTarget {
  #mainNode;
  #contentNode;
  constructor(node) {
    super();
    this.#mainNode = node;
  }

  get contentNode() {
    return this.#contentNode;
  }

  show() {
    if (this.#mainNode.classList.contains('hidden')) {
      this.#mainNode.classList.remove('hidden');
      this.dispatchEvent(CustomEvent('dialogue:show'));
    }
  }
  hide() {
    if (!this.#mainNode.classList.contains('hidden')) {
      this.#mainNode.classList.add('hidden');
      this.dispatchEvent(CustomEvent('dialogue:hide'));
    }
  }
  close() {
    if (this.#mainNode.parentNode) {
      this.#mainNode.remove();
      this.dispatchEvent(CustomEvent('dialogue:close'));
    }
  }
}

export function init(node, {TEMPLATES, renderTemplate}) {
  console.debug('dialogues init', ...arguments);
  containerNode = node;
  LIB = {TEMPLATES, renderTemplate};
}

export function addTemplateDialogue(templateName, data, extraClasses=[]) {
  const rawContent = LIB.renderTemplate(TEMPLATES.dialogWrapper, {...data}, {...TEMPLATES, _dialogueView: TEMPLATES[templateName]});
  const mainNode = document.createElement('div');
  [...(extraClasses||[]), 'dialogue', 'hidden'].forEach(c => mainNode.classList.add(c));
  mainNode.innerHTML = rawContent;
  containerNode.appendChild(mainNode);

  let obj = new Dialogue(mainNode);
  dialogues.add(obj);
  return obj;
}
