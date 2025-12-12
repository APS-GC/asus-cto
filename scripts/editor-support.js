import {
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  getMetadata,
  loadBlock,
  loadScript,
  loadSections,
} from './aem.js';

import { decorateRichtext } from './editor-support-rte.js';
import { decorateMain } from './scripts.js';
import { initializePublish } from './editor-support-publish.js'

let editorRules = null;

async function loadEditorRules() {
  if (!editorRules) {
    try {
      const response = await fetch(`${window.hlx.codeBasePath}/editor-rules.json`);
      editorRules = await response.json();
    } catch (error) {
      console.error('Failed to load editor rules:', error);
      editorRules = { blocks: {} };
    }
  }
  return editorRules;
}

function showAuthorError(message, block) {
  let toast = document.querySelector('.author-error-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'author-error-toast';
    toast.style.cssText = `
      background: #d9534f;
      color: white;
      padding: 12px 18px;
      border-radius: 8px;
      font-size: 14px;
    `;
    block.append(toast);
  }

  toast.textContent = message;
  setTimeout(() => toast.remove(), 4000);
}

function interpolateMessage(template, variables) {
  return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
}

async function enforceBlockRules(event, eventType) {
  const rules = await loadEditorRules();
  const container = event?.detail?.request?.target?.container;
  if (!container) return true;

  const blockEl = document.querySelector(`[data-aue-resource="${container.resource}"]`);
  if (!blockEl) return true;

  const blockModel = blockEl.dataset.aueModel || blockEl.dataset.blockName;
  const blockRules = rules.blocks[blockModel];
  if (!blockRules) return true;

  for (const [childType, config] of Object.entries(blockRules)) {
    const childModel = config.model;
    const rule = config.rules?.[eventType];
    if (!rule) continue;

    const children = blockEl.querySelectorAll(`[data-aue-model="${childModel}"]`);
    const currentCount = children.length;

    let isValid = true;
    if (rule.validate === 'maxCount' && currentCount >= config.maxCount) {
      isValid = false;
    } else if (rule.validate === 'minCount' && currentCount <= config.minCount) {
      isValid = false;
    }

    if (!isValid) {
      const message = interpolateMessage(rule.errorMessage, {
        maxCount: config.maxCount,
        minCount: config.minCount,
        currentCount,
        childType
      });
      showAuthorError(message, blockEl.parentElement);
    }
  }

  return true;
}

function setUEFilter(element, filter) {
  element.dataset.aueFilter = filter;
}

function updateUEInstrumentation() {
  const main = document.querySelector('main');
  if (!main) return;

  const theme = getMetadata('og:title') || '';
  setUEFilter(main, theme ? `main-${theme}` : 'main');
}


async function applyChanges(event) {
  // redecorate default content and blocks on patches (in the properties rail)
  const { detail } = event;

  const resource = detail?.request?.target?.resource // update, patch components
    || detail?.request?.target?.container?.resource // update, patch, add to sections
    || detail?.request?.to?.container?.resource; // move in sections
  if (!resource) return false;

  const updates = detail?.response?.updates;
  if (!updates.length) return false;

  const { content } = updates[0];
  if (!content) return false;

  // load dompurify
  await loadScript(`${window.hlx.codeBasePath}/scripts/dompurify.min.js`);

  const sanitizedContent = window.DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
  const parsedUpdate = new DOMParser().parseFromString(sanitizedContent, 'text/html');
  const element = document.querySelector(`[data-aue-resource="${resource}"]`);

  if (element) {
    if (element.matches('main')) {
      const newMain = parsedUpdate.querySelector(`[data-aue-resource="${resource}"]`);
      newMain.style.display = 'none';
      element.insertAdjacentElement('afterend', newMain);
      decorateMain(newMain);
      decorateRichtext(newMain);
      await loadSections(newMain);
      element.remove();
      newMain.style.display = null;
      // eslint-disable-next-line no-use-before-define
      attachEventListners(newMain);
      return true;
    }

    const block = element.parentElement?.closest('.block[data-aue-resource]') || element?.closest('.block[data-aue-resource]');
    if (block) {
      const blockResource = block.getAttribute('data-aue-resource');
      const newBlock = parsedUpdate.querySelector(`[data-aue-resource="${blockResource}"]`);
      if (newBlock) {
        newBlock.style.display = 'none';
        block.insertAdjacentElement('afterend', newBlock);
        decorateButtons(newBlock);
        decorateIcons(newBlock);
        decorateBlock(newBlock);
        decorateRichtext(newBlock);
        await loadBlock(newBlock);
        block.remove();
        newBlock.style.display = null;
        return true;
      }
    } else {
      // sections and default content, may be multiple in the case of richtext
      const newElements = parsedUpdate.querySelectorAll(`[data-aue-resource="${resource}"],[data-richtext-resource="${resource}"]`);
      if (newElements.length) {
        const { parentElement } = element;
        if (element.matches('.section')) {
          const [newSection] = newElements;
          newSection.style.display = 'none';
          element.insertAdjacentElement('afterend', newSection);
          decorateButtons(newSection);
          decorateIcons(newSection);
          decorateRichtext(newSection);
          decorateSections(parentElement);
          decorateBlocks(parentElement);
          await loadSections(parentElement);
          element.remove();
          newSection.style.display = null;
        } else {
          element.replaceWith(...newElements);
          decorateButtons(parentElement);
          decorateIcons(parentElement);
          decorateRichtext(parentElement);
        }

        return true;
      }
    }
  }

  return false;
}

function attachEventListners(main) {
  const eventTypeMap = {
    'aue:content-patch': 'patch',
    'aue:content-update': 'update',
    'aue:content-add': 'add',
    'aue:content-move': 'move',
    'aue:content-remove': 'remove',
    'aue:content-copy': 'copy',
  };

  Object.entries(eventTypeMap).forEach(([eventType, action]) => main?.addEventListener(eventType, async (event) => {
    event.stopPropagation();

    const allowed = await enforceBlockRules(event, action);
    if (!allowed) return;

    const applied = await applyChanges(event);

    if (applied) {
      updateUEInstrumentation();
    } else {
      window.location.reload();
    }
  }));
}

initializePublish();

attachEventListners(document.querySelector('main'));

updateUEInstrumentation();

// decorate rich text
// this has to happen after decorateMain(), and everythime decorateBlocks() is called
decorateRichtext();
// in cases where the block decoration is not done in one synchronous iteration we need to listen
// for new richtext-instrumented elements. this happens for example when using experimentation.
const observer = new MutationObserver(() => decorateRichtext());
observer.observe(document, { attributeFilter: ['data-richtext-prop'], subtree: true });
