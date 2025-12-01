import {
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  loadBlock,
  loadScript,
  loadSections,
  getMetadata,
} from './aem.js';

import { decorateRichtext } from './editor-support-rte.js';
import { decorateMain } from './scripts.js';

let adminAccessConfig = null;

async function loadAdminAccessConfig() {
  if (!adminAccessConfig) {
    try {
      const response = await fetch(`${window.hlx.codeBasePath}/admin-access.json`);
      adminAccessConfig = await response.json();
    } catch (error) {
      console.error('Failed to load admin access config:', error);
      adminAccessConfig = { access: { admin: { role: {} } } };
    }
  }
  return adminAccessConfig;
}

function getCurrentUserEmail() {
  try {
    const key = "adobeid_ims_profile/exc_app/false/AdobeID,ab.manage,account_cluster.read,additional_info,additional_info.job_function,additional_info.projectedProductContext,additional_info.roles,adobeio.appregistry.read,adobeio_api,aem.frontend.all,audiencemanager_api,creative_cloud,mps,openid,org.read,pps.read,read_organizations,read_pc,read_pc.acp,read_pc.dma_tartan,service_principals.write,session";
    const value = sessionStorage.getItem(key);
    if (value) {
      const profile = JSON.parse(value);
      return profile.email?.toLowerCase();
    }
  } catch (error) {
    console.error('Failed to get user email:', error);
  }
  return null;
}

function getUserRole(userEmail, config) {
  const roles = config?.access?.admin?.role || {};
  
  for (const [roleName, emails] of Object.entries(roles)) {
    if (emails.some(email => email.toLowerCase() === userEmail)) {
      return roleName;
    }
  }
  
  return null;
}

function getDisabledCapabilities(role) {
  const roleCapabilities = {
    admin: [],
    author: ['publish'],
    publish: [],
    default: ['publish']
  };
  
  return roleCapabilities[role] || roleCapabilities.default;
}

function setUEDisableConfig(capabilities) {
  if (!capabilities.length) return;
  
  const head = document.getElementsByTagName('head')[0];
  const existingMeta = head.querySelector('meta[name="urn:adobe:aue:config:disable"]');
  
  if (existingMeta) {
    existingMeta.setAttribute('content', capabilities.join(','));
  } else {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'urn:adobe:aue:config:disable');
    meta.setAttribute('content', capabilities.join(','));
    head.appendChild(meta);
  }
}

async function applyUserPermissions() {
  const userEmail = getCurrentUserEmail();
  if (!userEmail) {
    console.warn('No user email found, applying default restrictions');
    setUEDisableConfig(['publish', 'unpublish', 'delete']);
    return;
  }
  
  const config = await loadAdminAccessConfig();
  const userRole = getUserRole(userEmail, config);
  
  if (!userRole) {
    console.warn(`User ${userEmail} has no assigned role, applying default restrictions`);
    setUEDisableConfig(['publish', 'unpublish', 'delete']);
    return;
  }
  
  const disabledCapabilities = getDisabledCapabilities(userRole);
  setUEDisableConfig(disabledCapabilities);
  
}

// Set the filter for a Universal Editor editable element
function setUEFilter(element, filter) {
  element.dataset.aueFilter = filter;
}

/**
 * Update Universal Editor component filters based on page structure
 * See: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/attributes-types
 */
function updateUEInstrumentation() {
  const main = document.querySelector('main');
  if (!main) return;

  const theme = getMetadata('og:title') || '';
  setUEFilter(main, theme?`main-${theme}`:'main');
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
  [
    'aue:content-patch',
    'aue:content-update',
    'aue:content-add',
    'aue:content-move',
    'aue:content-remove',
    'aue:content-copy',
  ].forEach((eventType) => main?.addEventListener(eventType, async (event) => {
    event.stopPropagation();
    const applied = await applyChanges(event);
    if (applied) {
      // Update UE instrumentation after successful changes
      updateUEInstrumentation();
    } else {
      window.location.reload();
    }
  }));
}

attachEventListners(document.querySelector('main'));

// Apply user permissions based on admin-access.json
applyUserPermissions();

// Update UE component filters on page load
updateUEInstrumentation();

// decorate rich text
// this has to happen after decorateMain(), and everythime decorateBlocks() is called
decorateRichtext();
// in cases where the block decoration is not done in one synchronous iteration we need to listen
// for new richtext-instrumented elements. this happens for example when using experimentation.
const observer = new MutationObserver(() => decorateRichtext());
observer.observe(document, { attributeFilter: ['data-richtext-prop'], subtree: true });
