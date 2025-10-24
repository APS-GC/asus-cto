# Product Card Block

An EDS (Edge Delivery Services) block that displays product cards in a responsive carousel format with Universal Editor authoring support and GraphQL API integration.

## Features

- ✅ **GraphQL API Integration** - Fetches product data from configurable endpoints
- ✅ **Mock API Support** - Includes mock data for development and testing
- ✅ **Responsive Carousel** - Shows 3 items by default with navigation controls
- ✅ **Universal Editor Support** - Drag-and-drop functionality with configurable properties
- ✅ **Product Information Display** - Comprehensive product details including specs, pricing, FPS benchmarks
- ✅ **Interactive Features** - Quick view, compare functionality, hover effects
- ✅ **Accessibility** - Full ARIA support and keyboard navigation
- ✅ **Mobile Responsive** - Optimized for all screen sizes
- ✅ **Auto-play Carousel** - Configurable auto-advance with pause on hover
- ✅ **Loading States** - Proper loading and error handling

## File Structure

```
blocks/product-card/
├── product-card.js          # Main block logic
├── product-card.css         # Block styles
├── _product-card.json       # UE authoring model
└── README.md               # Documentation
```

## Usage

### Basic HTML Structure

```html
<div class="product-card block" data-block-name="product-card">
  <div>
    <div>Item Count</div>
    <div>3</div>
  </div>
</div>
```

### Configuration Options

The block supports the following configuration options through Universal Editor:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `item-count` | number | 3 | Number of products to display (1-10) |
| `api-endpoint` | text | /mock-api/products | GraphQL API endpoint |
| `autoplay-interval` | number | 5000 | Auto-play interval in milliseconds (0 to disable) |

### Configuration Examples

**Display 5 products:**
```html
<div class="product-card block">
  <div>
    <div>Item Count</div>
    <div>5</div>
  </div>
</div>
```

**Custom API endpoint:**
```html
<div class="product-card block">
  <div>
    <div>Item Count</div>
    <div>3</div>
  </div>
  <div>
    <div>API Endpoint</div>
    <div>/api/graphql/products</div>
  </div>
</div>
```

**Disable auto-play:**
```html
<div class="product-card block">
  <div>
    <div>Item Count</div>
    <div>3</div>
  </div>
  <div>
    <div>Auto-play Interval</div>
    <div>0</div>
  </div>
</div>
```

## API Integration

### Mock API

The block includes a mock GraphQL API that returns sample ASUS gaming desktop products. The mock data includes:

- Product names and models
- High-quality product images with hover states
- Pricing information with discounts
- Gaming FPS benchmarks
- Detailed specifications
- Bazaarvoice integration IDs

### Real API Integration

To integrate with a real GraphQL API, update the `fetchProductData` function in `product-card.js`:

```javascript
async function fetchProductData(endpoint, limit = 3) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query GetProducts($limit: Int!) {
          products(limit: $limit) {
            id
            name
            model
            image
            imageHover
            price
            originalPrice
            discount
            bazaarvoiceProductId
            benchmarkGame
            fps
            specs
          }
        }
      `,
      variables: { limit }
    })
  });
  
  const data = await response.json();
  return data.data.products;
}
```

### Expected Data Structure

```javascript
{
  "products": [
    {
      "id": "string",              // Unique product identifier
      "name": "string",            // Product display name
      "model": "string",           // Product model number
      "image": "string",           // Main product image URL
      "imageHover": "string",      // Optional hover image URL
      "price": "string",           // Current price (without currency symbol)
      "originalPrice": "string",   // Original price for strikethrough
      "discount": "string",        // Discount amount
      "bazaarvoiceProductId": "string", // For reviews integration
      "benchmarkGame": "string",   // Game name for FPS benchmark
      "fps": "string",            // FPS score
      "specs": ["string"]         // Array of product specifications
    }
  ]
}
```

## Universal Editor Integration

### Authoring Model

The block includes a `_product-card.json` file that defines the authoring interface:

```json
{
  "groups": [
    {
      "title": "Product Card Settings",
      "id": "product-card-settings",
      "properties": [
        {
          "label": "Number of Items",
          "name": "item-count",
          "type": "number",
          "min": 1,
          "max": 10
        }
      ]
    }
  ]
}
```

### Drag and Drop

1. Open Universal Editor
2. Navigate to the blocks panel
3. Drag the "Product Card" block to your page
4. Configure the properties in the right panel
5. Publish your changes

## Styling

### CSS Classes

The block uses BEM methodology for CSS class naming:

- `.product-card` - Block container
- `.cmp-product-card` - Individual product card
- `.cmp-carousel` - Carousel container
- `.cmp-carousel__item` - Carousel slides
- `.cmp-carousel__actions` - Navigation buttons
- `.cmp-carousel__indicators` - Dot indicators

### Customization

Override styles by targeting the CSS classes:

```css
.cmp-product-card {
  background: your-custom-color;
  border-radius: your-custom-radius;
}

.cmp-product-card__title {
  font-size: your-custom-size;
  color: your-custom-color;
}
```

## Responsive Behavior

- **Mobile (< 768px)**: Single column layout, simplified navigation
- **Tablet (768px - 1024px)**: Shows 3 cards side by side
- **Desktop (> 1024px)**: Full carousel experience with all features

## Accessibility Features

- Full ARIA support for screen readers
- Keyboard navigation for carousel controls
- Focus management for interactive elements
- Semantic HTML structure
- Alt text for all images
- High contrast color schemes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Lazy loading for product images
- Optimized CSS animations
- Minimal JavaScript footprint
- CDN-ready image URLs
- Efficient DOM manipulation

## Troubleshooting

### Common Issues

**Block not loading:**
- Check browser console for JavaScript errors
- Verify CSS and JS files are properly linked
- Ensure block is properly decorated

**API errors:**
- Check network tab for failed requests
- Verify API endpoint is accessible
- Check CORS configuration

**Styling issues:**
- Clear browser cache
- Check CSS file is loaded
- Verify CSS classes are applied

### Debug Mode

Enable debug logging by adding this to your console:

```javascript
// Enable debug logging
localStorage.setItem('product-card-debug', 'true');
```

## Contributing

1. Follow the existing code style
2. Add comments for complex logic
3. Test across different browsers
4. Update documentation for new features
5. Ensure accessibility compliance

## License

This block is part of the ASUS EDS project and follows the project's licensing terms.
