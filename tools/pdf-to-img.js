/**
 * PDF to Image Converter
 * Uses Mozilla pdf.js to render PDF pages to canvas and export as images
 */

let pdfjsLib = null;

/**
 * Lazy load pdf.js library
 * @returns {Promise} Promise that resolves when pdf.js is loaded
 */
async function loadPdfJs() {
    if (pdfjsLib) {
        return pdfjsLib;
    }

    // Load pdf.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(script);

    return new Promise((resolve, reject) => {
        script.onload = () => {
            pdfjsLib = window.pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(pdfjsLib);
        };
        script.onerror = () => reject(new Error('Failed to load pdf.js'));
    });
}

/**
 * Parse page range string (e.g., "1", "1-3", "1,3,5", "all")
 * @param {string} rangeStr - Page range string
 * @param {number} totalPages - Total number of pages in PDF
 * @returns {Array<number>} Array of page numbers (1-indexed)
 */
function parsePageRange(rangeStr, totalPages) {
    if (!rangeStr || rangeStr.toLowerCase().trim() === 'all') {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set();
    const parts = rangeStr.split(',').map(p => p.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                throw new Error(`Invalid page range: ${part}`);
            }
            for (let i = start; i <= end; i++) {
                pages.add(i);
            }
        } else {
            const page = parseInt(part, 10);
            if (isNaN(page) || page < 1 || page > totalPages) {
                throw new Error(`Invalid page number: ${part}`);
            }
            pages.add(page);
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Convert a PDF page to an image
 * @param {Object} page - pdf.js page object
 * @param {number} dpi - DPI for rendering
 * @param {string} format - Output format ('jpg' or 'png')
 * @returns {Promise<Blob>} Image blob
 */
async function pageToImage(page, dpi, format) {
    const scale = dpi / 72; // pdf.js uses 72 DPI as base
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    
    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert canvas to blob'));
                }
            },
            format === 'jpg' ? 'image/jpeg' : 'image/png',
            format === 'jpg' ? 0.92 : 1.0
        );
    });
}

/**
 * Convert PDF to images
 * @param {File} pdfFile - The PDF file
 * @param {string} pageRange - Page range string (e.g., "all", "1", "1-3", "1,3,5")
 * @param {number} dpi - DPI for rendering (96, 150, or 300)
 * @param {string} format - Output format ('jpg' or 'png')
 * @param {Function} onProgress - Progress callback (page, total, percentage)
 * @returns {Promise<Array<{blob: Blob, filename: string, pageNumber: number}>>}
 */
export async function convertPdfToImages(pdfFile, pageRange, dpi, format, onProgress) {
    // Load pdf.js if not already loaded
    await loadPdfJs();

    // Load PDF document
    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    const pagesToConvert = parsePageRange(pageRange, totalPages);

    const results = [];

    for (let i = 0; i < pagesToConvert.length; i++) {
        const pageNumber = pagesToConvert[i];
        const page = await pdf.getPage(pageNumber);

        // Report progress
        if (onProgress) {
            const percentage = Math.round(((i + 1) / pagesToConvert.length) * 100);
            onProgress(pageNumber, pagesToConvert.length, percentage);
        }

        // Convert page to image
        const blob = await pageToImage(page, dpi, format);
        const filename = `${pdfFile.name.replace(/\.pdf$/i, '')}_page${pageNumber}.${format}`;

        results.push({
            blob,
            filename,
            pageNumber
        });
    }

    return results;
}

