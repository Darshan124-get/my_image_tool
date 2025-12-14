# imglow

A production-ready static website offering three browser-based image processing tools: PDF to JPG/PNG conversion, image resizing, and image compression. All processing happens entirely in the user's browser — no server, no uploads, 100% private.

## Features

- **PDF to JPG/PNG Converter**: Convert PDF pages to high-quality images with customizable DPI (96, 150, 300) and page selection
- **Image Resize**: Resize images to specific dimensions with automatic aspect ratio preservation
- **Image Compress**: Compress images to reduce file size with quality control and multiple format support (JPEG, WebP, PNG)

## Architecture

imglow is a fully static website that uses:
- **pdf.js** (Mozilla) for PDF rendering to canvas
- **Pica** for high-quality image resizing
- **browser-image-compression** for client-side image compression
- **JSZip** for creating ZIP archives of multiple PDF pages

All libraries are loaded from CDN with lazy loading to optimize initial page load. All processing happens client-side using WebAssembly and JavaScript.

## Installation & Local Development

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- A local web server (for testing)

### Quick Start

1. Clone or download this repository
2. Serve the files using a local web server:

   **Using Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Using Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   ```

   **Using PHP:**
   ```bash
   php -S localhost:8000
   ```

3. Open `http://localhost:8000` in your browser

### Self-Hosting Libraries (Optional)

To self-host libraries instead of using CDN:

1. Download the following libraries:
   - [pdf.js](https://mozilla.github.io/pdf.js/) (v3.11.174)
   - [Pica](https://github.com/nodeca/pica) (v9.0.1)
   - [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) (v2.0.2)
   - [JSZip](https://github.com/Stuk/jszip) (v3.10.1)

2. Place them in a `libs/` directory
3. Update the import URLs in:
   - `tools/pdf-to-img.js` (pdf.js)
   - `tools/image-resize.js` (Pica)
   - `tools/image-compress.js` (browser-image-compression)
   - `utils/download.js` (JSZip)

## Deployment

### Netlify

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Sign in to [Netlify](https://www.netlify.com/)
3. Click "New site from Git"
4. Select your repository
5. Build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `/` (root)
6. Click "Deploy site"
7. Update `yourdomain.com` in `index.html` with your Netlify domain

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. In the project directory, run: `vercel`
3. Follow the prompts
4. Update `yourdomain.com` in `index.html` with your Vercel domain

### GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select source branch (usually `main` or `master`)
4. Select `/ (root)` as the folder
5. Click Save
6. Your site will be available at `https://username.github.io/repository-name`
7. Update `yourdomain.com` in `index.html` with your GitHub Pages URL

### Cloudflare Pages

1. Push your code to a Git repository
2. Sign in to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Click "Create a project"
4. Connect your repository
5. Build settings:
   - **Framework preset**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `/`
6. Click "Save and Deploy"
7. Update `yourdomain.com` in `index.html` with your Cloudflare Pages domain

### Important: Update Domain Placeholders

After deployment, update the following in `index.html`:
- Replace all instances of `https://yourdomain.com/` with your actual domain
- Update `og:url` and `og:image` meta tags
- Update canonical link
- Update JSON-LD structured data URLs

## Testing

### Manual Test Cases

#### PDF to Image Tool
- [ ] Convert single page PDF (page "1")
- [ ] Convert multiple pages (page range "1-3")
- [ ] Convert specific pages (pages "1,3,5")
- [ ] Convert all pages ("all")
- [ ] Test different DPI settings (96, 150, 300)
- [ ] Test JPG and PNG output formats
- [ ] Download individual pages
- [ ] Download all pages as ZIP (multi-page PDF)
- [ ] Test with large PDF files (>10MB)
- [ ] Verify no network uploads in DevTools Network tab

#### Image Resize Tool
- [ ] Resize with width only (preserves aspect ratio)
- [ ] Resize with height only (preserves aspect ratio)
- [ ] Resize with both width and height
- [ ] Use preset buttons (720p, 1280p, 1920p)
- [ ] Test with JPG, PNG, and WebP input
- [ ] Verify output dimensions match input
- [ ] Test with very large images (>5MB)
- [ ] Verify no network uploads in DevTools Network tab

#### Image Compress Tool
- [ ] Compress with quality 10 (low quality, small size)
- [ ] Compress with quality 80 (recommended)
- [ ] Compress with quality 100 (high quality)
- [ ] Test JPEG output format
- [ ] Test WebP output format
- [ ] Test PNG output format (lossless)
- [ ] Verify file size reduction shown in stats
- [ ] Test with various image formats (JPG, PNG, WebP)
- [ ] Verify no network uploads in DevTools Network tab

#### General
- [ ] Test drag-and-drop file upload
- [ ] Test file input button
- [ ] Test on mobile device (responsive design)
- [ ] Test keyboard navigation (Tab, Enter, Space)
- [ ] Verify accessibility (screen reader, focus states)
- [ ] Test error handling (invalid files, network errors)
- [ ] Verify all downloads work correctly
- [ ] Check browser console for errors

### Performance Testing

1. **Lighthouse Audit**:
   - Open Chrome DevTools
   - Go to Lighthouse tab
   - Run audit for Performance, Accessibility, Best Practices, SEO
   - Target scores: Performance > 85, Accessibility > 90, SEO > 90

2. **Network Tab Verification**:
   - Open DevTools → Network tab
   - Process an image or PDF
   - Verify no POST/PUT requests with file data
   - Only CDN requests for libraries should appear

### Automated Testing (Optional)

For automated testing, consider:
- **Cypress**: E2E testing for tool workflows
- **Playwright**: Cross-browser testing
- **Jest**: Unit testing for utility functions

Example Cypress test structure:
```javascript
describe('PDF to Image Tool', () => {
  it('should convert PDF to images', () => {
    cy.visit('/');
    cy.get('#pdf-input').attachFile('test.pdf');
    cy.get('#pdf-form').submit();
    cy.get('#pdf-results').should('be.visible');
  });
});
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Limitations

1. **PDF.js**: Very large PDFs (>50MB) may cause performance issues
2. **Image Size**: Very large images (>20MB) may cause browser memory issues
3. **Browser Memory**: Processing multiple large files simultaneously may exceed browser memory limits
4. **WebP Support**: WebP format requires modern browser support
5. **Offline**: Requires internet connection for initial CDN library loads (unless self-hosted)

## Privacy & Security

- **No Uploads**: All files are processed entirely in the browser
- **No Storage**: No files are stored on any server
- **No Tracking**: No analytics by default (optional GA4 snippet provided, commented out)
- **No Cookies**: No cookies are set
- **Open Source**: Full source code available for inspection

## SEO Optimization

The site includes:
- Comprehensive meta tags (title, description, keywords)
- OpenGraph tags for social sharing
- Twitter Card meta tags
- JSON-LD structured data (WebSite, FAQPage, HowTo)
- Semantic HTML5 elements
- Sitemap.xml and robots.txt
- Keyword-rich content sections

## Performance Optimization

- Lazy loading of heavy libraries (pdf.js, Pica)
- CDN delivery for libraries
- Minimal inline scripts
- Optimized CSS (mobile-first, efficient selectors)
- Progressive enhancement

## Contributing

See `CONTRIBUTING.md` for contribution guidelines.

## License

MIT License - see `LICENSE` file for details.

## Support

For issues, questions, or contributions, please open an issue on the repository.

## Changelog

### v1.0.0
- Initial release
- PDF to JPG/PNG conversion
- Image resize tool
- Image compression tool
- Full SEO optimization
- Responsive design
- Accessibility features

