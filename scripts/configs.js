// Store config globally to avoid multiple requests within the same page
let configPromise = null;

const CONFIG_STORAGE_KEY = 'configurations';

/**
 * Fetches the configuration JSON file
 * @returns {Promise<Object>} - The configuration object
 */
const loadConfig = async () => {
  // Check session storage first
  const cachedConfig = sessionStorage.getItem(CONFIG_STORAGE_KEY);
  if (cachedConfig) {
    try {
      return JSON.parse(cachedConfig);
    } catch (error) {
      console.warn('Failed to parse cached configuration:', error);
      // Continue to fetch if parsing fails
    }
  }

  // Fetch from server if not in cache
  try {
    const response = await fetch('/configuration.json');
    if (!response.ok) {
      throw new Error(`Failed to load configuration: ${response.status}`);
    }
    const config = await response.json();
    
    // Store in session storage for future page loads
    sessionStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    
    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return { data: [] };
  }
};

/**
 * Retrieves a configuration value by key
 * @param {string} key - The configuration key to retrieve
 * @returns {Promise<string|undefined>} - The value of the configuration parameter, or undefined
 */
export const getConfigValue = async (key) => {
  // Initialize config promise if not already done
  if (!configPromise) {
    configPromise = loadConfig();
  }

  const config = await configPromise;
  const configData = config.data || [];
  const configItem = configData.find((item) => item.key === key);
  return configItem?.value;
};

/**
 * Loads block definition JSON and extracts field order
 * @param {string} blockName - Name of the block (e.g., 'hot-products')
 * @returns {Promise<Array<string>>} - Array of field names in order
 */
export const getBlockFieldOrder = async (blockName) => {
  try {
    const response = await fetch(`/blocks/${blockName}/_${blockName}.json`);
    if (!response.ok) {
      console.warn(`Could not load block definition for ${blockName}`);
      return [];
    }
    const blockDef = await response.json();
    
    // Extract field names from the first model's fields
    const model = blockDef.models?.[0];
    if (model && model.fields) {
      return model.fields.map(field => field.name);
    }
    
    return [];
  } catch (error) {
    console.warn(`Error loading block field order for ${blockName}:`, error);
    return [];
  }
};

/**
 * Parses configuration from a block element
 * @param {HTMLElement} block - The block element containing configuration rows
 * @param {Object} defaults - Default configuration object
 * @param {string} blockName - Optional block name (e.g., 'hot-products') to auto-load field order
 * @returns {Promise<Object>} - Parsed configuration object merged with defaults
 */
export const getBlockConfigs = async (block, defaults = {}, blockName = '') => {
  const config = { ...defaults };

  if (!block || !block.children || !block.children.length) {
    return config;
  }

  const rows = [...block.children];

  // Try to parse as key-value pairs (2 cells per row)
  const hasKeyValuePairs = rows.some(row => row.children.length >= 2);

  if (hasKeyValuePairs) {
    // Standard key-value pair format
    rows.forEach((row) => {
      const cells = [...row.children];
      if (cells.length >= 2) {
        const key = cells[0].textContent.trim();
        const value = cells[1].textContent.trim();

        if (key && value !== '') {
          // Convert key to camelCase format
          const camelKey = key
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase());

          // Try to parse as number if it looks like a number
          const numValue = Number(value);
          if (!isNaN(numValue) && value !== '') {
            config[camelKey] = numValue;
          } else {
            config[camelKey] = value;
          }
        }
      }
    });
  } else if (blockName) {
    // Universal Editor format - load field order and map by position
    const fieldOrder = await getBlockFieldOrder(blockName);
    
    if (fieldOrder.length > 0) {
      rows.forEach((row, index) => {
        if (index < fieldOrder.length) {
          const cell = row.children[0];
          if (cell) {
            const value = cell.textContent.trim();
            const fieldName = fieldOrder[index];

            if (value !== '') {
              // Try to parse as number if it looks like a number
              const numValue = Number(value);
              if (!isNaN(numValue) && value !== '') {
                config[fieldName] = numValue;
              } else {
                config[fieldName] = value;
              }
            }
          }
        }
      });
    }
  }

  return config;
};
