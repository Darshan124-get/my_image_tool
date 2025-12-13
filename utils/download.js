/**
 * Download utility functions
 * Handles file downloads and object URL cleanup
 */

/**
 * Downloads a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up object URL after a short delay
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

let JSZipLoaded = false;

/**
 * Load JSZip library dynamically
 * @returns {Promise} Promise that resolves when JSZip is loaded
 */
function loadJSZip() {
    if (window.JSZip) {
        JSZipLoaded = true;
        return Promise.resolve();
    }

    if (JSZipLoaded) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = () => {
            JSZipLoaded = true;
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}

/**
 * Downloads multiple files as a ZIP archive
 * @param {Array<{blob: Blob, filename: string}>} files - Array of file objects
 * @param {string} zipFilename - Name for the ZIP file
 * @returns {Promise<void>}
 */
export async function downloadAsZip(files, zipFilename = 'download.zip') {
    // Load JSZip if not already loaded
    await loadJSZip();
    
    if (!window.JSZip) {
        throw new Error('JSZip library failed to load');
    }
    
    const zip = new window.JSZip();
    
    // Add all files to the ZIP
    for (const file of files) {
        zip.file(file.filename, file.blob);
    }
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Download the ZIP
    downloadBlob(zipBlob, zipFilename);
}

/**
 * Formats file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

