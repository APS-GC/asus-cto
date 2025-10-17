import { AppConfig } from '../../appConfig';

export const fetchData = async (endpoint, options) => {
  // For Magento or Mock APIs
  const url = `${AppConfig.apiEndPoint.base}${endpoint}`;

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
};
