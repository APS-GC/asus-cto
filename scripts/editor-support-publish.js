/*
 * Get account publish permissions and determine if publishing is disabled
 */
export default async function initializePublish() {
  try {
    const { canPublish } = await getAccountPublishAuth();
    if (!canPublish) {
      updateHeadMetaTag('urn:adobe:aue:config:disable', 'publish,publish-live');
    }
  } catch (error) {
    console.log('Faild to get account auth');
  }
}

//get account publish auth
async function getAccountPublishAuth() {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        let contentPath = '';
        if (location.hash.includes('universal-editor/canvas')) {
          const match = location.hash.match(
            /canvas\/[^/]+(\/content\/asus-cto\/.*)$/
          );
          if (match) contentPath = match[1].replace(/\.html$/, '');
        } else {
          const match = location.pathname.match(/(\/content\/asus-cto\/.*)/);
          if (match) contentPath = match[1].replace(/\.html$/, '');
        }
        if (!contentPath) {
          console.error('Failed to extract content path');
          return;
        }
        const response = await fetch(
          '/bin/asuscto/checkPermission?path=' + encodeURIComponent(contentPath)
        );
        const data = await response.json();
        resolve(data);
      } catch (err) {
        console.error('Permission check failed:', err);
        reject(err);
      }
    })();
  });
}

//update head meta
function updateHeadMetaTag(key, contentValue) {
  const metaTags = document.querySelectorAll(`meta[name="${key}"]`);

  if (metaTags.length > 0) {
    metaTags.forEach((metaTag) => {
      metaTag.setAttribute('content', contentValue);
    });
    console.log(`Updated meta tag content to: '${contentValue}'`);
    return true;
  } else {
    const newMeta = document.createElement('meta');
    newMeta.setAttribute('name', key);
    newMeta.setAttribute('content', contentValue);

    // Add to head
    document.head.appendChild(newMeta);
    console.log(`Created new meta tag with content: '${contentValue}'`);
    return true;
  }
}
