import { loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  console.log("Hello 1")
  // const [quoteWrapper] = block.children;
  // const blockquote = document.createElement('blockquote');
  // blockquote.textContent = quoteWrapper.textContent.trim();
  // quoteWrapper.replaceChildren(blockquote);
}
