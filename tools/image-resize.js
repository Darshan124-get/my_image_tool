/**
 * Image Resize Tool
 * Uses Pica for high-quality image resizing in the browser
 */

let pica = null;

/**
 * Lazy load Pica library
 * @returns {Promise} Promise that resolves when Pica is loaded
 */
async function loadPica() {
    if (pica) {
        return pica;
    }

    // Load Pica from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pica@9.0.1/dist/pica.min.js';
    document.head.appendChild(script);

    return new Promise((resolve, reject) => {
        script.onload = () => {
            pica = window.pica;
            resolve(pica);
        };
        script.onerror = () => reject(new Error('Failed to load Pica'));
    });
}

/**
 * Load image from file
 * @param {File} file - Image file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}

/**
 * Calculate dimensions preserving aspect ratio
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number|null} targetWidth - Target width (null to calculate from height)
 * @param {number|null} targetHeight - Target height (null to calculate from width)
 * @returns {{width: number, height: number}}
 */
function calculateDimensions(originalWidth, originalHeight, targetWidth, targetHeight) {
    if (targetWidth && targetHeight) {
        // Both specified, use as-is
        return { width: targetWidth, height: targetHeight };
    }

    if (targetWidth) {
        // Only width specified, calculate height
        const ratio = originalHeight / originalWidth;
        return { width: targetWidth, height: Math.round(targetWidth * ratio) };
    }

    if (targetHeight) {
        // Only height specified, calculate width
        const ratio = originalWidth / originalHeight;
        return { width: Math.round(targetHeight * ratio), height: targetHeight };
    }

    // Neither specified, return original
    return { width: originalWidth, height: originalHeight };
}

/**
 * Resize image using Pica
 * @param {File} imageFile - The image file to resize
 * @param {number|null} width - Target width (null to preserve ratio)
 * @param {number|null} height - Target height (null to preserve ratio)
 * @returns {Promise<{blob: Blob, filename: string, width: number, height: number}>}
 */
export async function resizeImage(imageFile, width, height) {
    // Load Pica if not already loaded
    await loadPica();

    // Load source image
    const sourceImg = await loadImage(imageFile);

    // Calculate target dimensions
    const dimensions = calculateDimensions(
        sourceImg.width,
        sourceImg.height,
        width,
        height
    );

    // Check if resizing is needed
    if (dimensions.width === sourceImg.width && dimensions.height === sourceImg.height) {
        // No resizing needed, return original
        return {
            blob: imageFile,
            filename: imageFile.name,
            width: sourceImg.width,
            height: sourceImg.height
        };
    }

    // Create destination canvas
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Resize using Pica
    await pica().resize(sourceImg, canvas, {
        unsharpAmount: 160,
        unsharpRadius: 0.6,
        unsharpThreshold: 2
    });

    // Convert canvas to blob
    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            },
            imageFile.type || 'image/jpeg',
            0.92
        );
    });

    // Generate filename
    const nameWithoutExt = imageFile.name.replace(/\.[^/.]+$/, '');
    const ext = imageFile.name.split('.').pop();
    const filename = `${nameWithoutExt}_${dimensions.width}x${dimensions.height}.${ext}`;

    return {
        blob,
        filename,
        width: dimensions.width,
        height: dimensions.height
    };
}

