/**
 * Image Compression Tool
 * Uses browser-image-compression for client-side image compression
 */

let imageCompression = null;

/**
 * Lazy load browser-image-compression library
 * @returns {Promise} Promise that resolves when library is loaded
 */
async function loadImageCompression() {
    if (imageCompression) {
        return imageCompression;
    }

    try {
        // Load browser-image-compression from CDN
        // Using dynamic import for ES module
        const module = await import('https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.esm.js');
        imageCompression = module.default || module;
        return imageCompression;
    } catch (error) {
        // Fallback: try loading as UMD script
        return new Promise((resolve, reject) => {
            if (window.imageCompression) {
                imageCompression = window.imageCompression;
                resolve(imageCompression);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.min.js';
            script.onload = () => {
                imageCompression = window.imageCompression;
                resolve(imageCompression);
            };
            script.onerror = () => reject(new Error('Failed to load browser-image-compression'));
            document.head.appendChild(script);
        });
    }
}

/**
 * Get MIME type for output format
 * @param {string} format - Format string ('jpeg', 'webp', 'png')
 * @returns {string} MIME type
 */
function getMimeType(format) {
    const mimeTypes = {
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'png': 'image/png'
    };
    return mimeTypes[format] || 'image/jpeg';
}

/**
 * Compress image
 * @param {File} imageFile - The image file to compress
 * @param {number} quality - Quality setting (0-1, where 1 is highest quality)
 * @param {string} format - Output format ('jpeg', 'webp', 'png')
 * @returns {Promise<{blob: Blob, filename: string, originalSize: number, compressedSize: number}>}
 */
export async function compressImage(imageFile, quality, format) {
    // Load library if not already loaded
    await loadImageCompression();

    const originalSize = imageFile.size;
    const mimeType = getMimeType(format);

    // Configure compression options
    const options = {
        maxSizeMB: 10, // Maximum size in MB (not really used for quality-based compression)
        maxWidthOrHeight: undefined, // Don't resize
        useWebWorker: true,
        fileType: mimeType
    };

    // For JPEG and WebP, use quality setting
    if (format === 'jpeg' || format === 'webp') {
        options.initialQuality = quality;
    }
    // For PNG, use lossless compression (browser-image-compression handles this)

    // Compress the image
    const compressedFile = await imageCompression(imageFile, options);

    // Generate filename
    const nameWithoutExt = imageFile.name.replace(/\.[^/.]+$/, '');
    const ext = format === 'jpeg' ? 'jpg' : format;
    const filename = `${nameWithoutExt}_compressed.${ext}`;

    return {
        blob: compressedFile,
        filename,
        originalSize,
        compressedSize: compressedFile.size
    };
}

