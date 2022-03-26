import {TEMPLATES} from './base.js';
const _RENDER = Mustache.render;

let CONTAINER_NODE = null;

//let LIB = null;
let containerNode = null;
let dialogues = [];

class Dialogue extends EventTarget {
  #mainNode;
  #contentNode;
  #closeButton;
  constructor(node) {
    super();
    this.#mainNode = node;
    this.#closeButton = node.querySelector('.dialogueHead .close');
  }

  get contentNode() {
    return this.#contentNode;
  }

  show() {
    if (this.#mainNode.classList.contains('hidden')) {
      this.#mainNode.classList.remove('hidden');
      this.dispatchEvent(new CustomEvent('dialogue:show'));
    }
  }
  hide() {
    if (!this.#mainNode.classList.contains('hidden')) {
      this.#mainNode.classList.add('hidden');
      this.dispatchEvent(new CustomEvent('dialogue:hide'));
    }
  }
  close() {
    if (this.#mainNode.parentNode) {
      this.#mainNode.remove();
      this.dispatchEvent(new CustomEvent('dialogue:close'));
    }
  }
}

/*
export function init(node, {TEMPLATES, renderTemplate}) {
  console.debug('dialogues init', ...arguments);
  containerNode = node;
  LIB = {TEMPLATES, renderTemplate};
}//*/

export function addTemplateDialogue(templateName, data={}, extraClasses=[]) {
  if (!CONTAINER_NODE) {
    CONTAINER_NODE = document.getElementById('dialogues');
    if (!CONTAINER_NODE) {
      console.error('cannot add dialogue: container node (#dialogues) is not (yet) available');
      return null;
    }
  }

  const rawContent = _RENDER(
    TEMPLATES.dialogue,
    data,
    {
      ...TEMPLATES,
      _dialogueView: TEMPLATES[templateName],
    }
  );
  const mainNode = document.createElement('div');
  [
    ...(extraClasses||[]),
    'dialogue',
    'hidden',
  ].forEach(c => mainNode.classList.add(c));
  mainNode.innerHTML = rawContent;
  CONTAINER_NODE.appendChild(mainNode);

  let obj = new Dialogue(mainNode);
  dialogues.push(obj);
  return obj;
}
