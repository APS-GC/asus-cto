const isProd = process.env.NODE_ENV === 'production';

export const AppConfig = {
  isProd,
  apiEndPoint: {
    // In prod, use the real Magento API. In dev, use the local mock server.
    base: isProd ? 'https://magento.api.com' : './clientlib-site/mocks/',
    products: isProd ? '/products' : 'products.json',
    hotProducts: isProd ? '/products?hot_product=1' : 'hot-products.json',
  },
};
