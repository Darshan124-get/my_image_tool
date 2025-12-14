/**
 * imglow - Main Application
 * Wires UI events and coordinates tool modules
 */

import { downloadBlob, downloadAsZip, formatFileSize } from './utils/download.js';
import { convertPdfToImages } from './tools/pdf-to-img.js';
import { resizeImage } from './tools/image-resize.js';
import { compressImage } from './tools/image-compress.js';

// Helper function to show file info
function showFileInfo(inputId, fileInfoId) {
    const input = document.getElementById(inputId);
    const fileInfo = document.getElementById(fileInfoId);
    const fileName = fileInfo.querySelector('.file-info-name');
    const fileSize = fileInfo.querySelector('.file-info-size');
    const removeBtn = fileInfo.querySelector('.file-info-remove');

    // Ensure file info is hidden by default
    fileInfo.hidden = true;

    function updateFileInfo() {
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileInfo.hidden = false;
        } else {
            fileInfo.hidden = true;
            fileName.textContent = '';
            fileSize.textContent = '';
        }
    }

    // Update on file selection
    input.addEventListener('change', updateFileInfo);

    // Remove button handler
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Clear the file input
        input.value = '';
        
        // Update file info display
        fileInfo.hidden = true;
        fileName.textContent = '';
        fileSize.textContent = '';
        
        // Clear any results, previews, and progress
        const form = input.closest('form');
        if (form) {
            // Clear results
            const resultsContainer = form.parentElement.querySelector('.results-container');
            if (resultsContainer) {
                resultsContainer.hidden = true;
                resultsContainer.innerHTML = '';
            }
            
            // Clear preview
            const previewContainer = form.parentElement.querySelector('.preview-container');
            if (previewContainer) {
                previewContainer.hidden = true;
                const previewImg = previewContainer.querySelector('img');
                if (previewImg) {
                    previewImg.src = '';
                }
            }
            
            // Clear progress
            const progressContainer = form.parentElement.querySelector('.progress-container');
            if (progressContainer) {
                progressContainer.hidden = true;
                const progressFill = progressContainer.querySelector('.progress-fill');
                if (progressFill) {
                    progressFill.style.width = '0%';
                }
            }
            
            // Clear stats (for compress tool)
            const statsContainer = form.parentElement.querySelector('.stats-container');
            if (statsContainer) {
                statsContainer.hidden = true;
            }
        }
        
        // Trigger change event to ensure form validation resets
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
    });

    // Initial update
    updateFileInfo();
}

// Initialize drag and drop for all file inputs
function initDragAndDrop(inputId) {
    const input = document.getElementById(inputId);
    const wrapper = input.closest('.file-input-wrapper');
    const label = wrapper.querySelector('.file-label');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        wrapper.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        wrapper.addEventListener(eventName, () => {
            wrapper.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        wrapper.addEventListener(eventName, () => {
            wrapper.classList.remove('drag-over');
        }, false);
    });

    wrapper.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            input.files = files;
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        }
    }, false);
}

// PDF to Image Tool
function initPdfTool() {
    const form = document.getElementById('pdf-form');
    const input = document.getElementById('pdf-input');
    const progressContainer = document.getElementById('pdf-progress');
    const progressFill = document.getElementById('pdf-progress-fill');
    const progressText = document.getElementById('pdf-progress-text');
    const resultsContainer = document.getElementById('pdf-results');

    initDragAndDrop('pdf-input');
    showFileInfo('pdf-input', 'pdf-file-info');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = input.files[0];
        if (!file) {
            showError(resultsContainer, 'Please select a PDF file');
            return;
        }

        const pageRange = document.getElementById('pdf-pages').value.trim() || 'all';
        const dpi = parseInt(document.getElementById('pdf-dpi').value, 10);
        const format = document.getElementById('pdf-format').value;

        // Show progress
        progressContainer.hidden = false;
        resultsContainer.hidden = true;
        resultsContainer.innerHTML = '';

        try {
            const results = await convertPdfToImages(
                file,
                pageRange,
                dpi,
                format,
                (currentPage, totalPages, percentage) => {
                    progressFill.style.width = `${percentage}%`;
                    progressText.textContent = `Processing page ${currentPage} of ${totalPages} (${percentage}%)`;
                }
            );

            // Hide progress
            progressContainer.hidden = true;

            // Show results
            resultsContainer.hidden = false;
            displayPdfResults(resultsContainer, results, file.name, format);

        } catch (error) {
            progressContainer.hidden = true;
            showError(resultsContainer, `Error: ${error.message}`);
        }
    });
}

function displayPdfResults(container, results, originalFilename, format) {
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = '<p class="error-message">No pages were converted.</p>';
        return;
    }

    const h4 = document.createElement('h4');
    h4.textContent = `Converted ${results.length} page${results.length > 1 ? 's' : ''}`;
    container.appendChild(h4);

    // Create download all as ZIP button if multiple pages
    if (results.length > 1) {
        const zipButton = document.createElement('button');
        zipButton.className = 'btn btn-primary';
        zipButton.textContent = `Download All as ZIP (${results.length} files)`;
        zipButton.addEventListener('click', async () => {
            try {
                const files = results.map(r => ({
                    blob: r.blob,
                    filename: r.filename
                }));
                const zipName = originalFilename.replace(/\.pdf$/i, '') + '_pages.zip';
                await downloadAsZip(files, zipName);
            } catch (error) {
                showError(container, `Error creating ZIP: ${error.message}`);
            }
        });
        container.appendChild(zipButton);
    }

    // Display each result
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const preview = document.createElement('img');
        preview.src = URL.createObjectURL(result.blob);
        preview.alt = `Page ${result.pageNumber} preview`;
        preview.onload = () => URL.revokeObjectURL(preview.src);

        const info = document.createElement('div');
        info.className = 'result-item-info';
        info.innerHTML = `
            <p><strong>Page ${result.pageNumber}</strong></p>
            <p>${result.filename}</p>
            <p>Size: ${formatFileSize(result.blob.size)}</p>
        `;

        const actions = document.createElement('div');
        actions.className = 'result-item-actions';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-primary';
        downloadBtn.textContent = 'Download';
        downloadBtn.addEventListener('click', () => {
            downloadBlob(result.blob, result.filename);
        });

        actions.appendChild(downloadBtn);
        resultItem.appendChild(preview);
        resultItem.appendChild(info);
        resultItem.appendChild(actions);
        container.appendChild(resultItem);
    });
}

// Image Resize Tool
function initResizeTool() {
    const form = document.getElementById('resize-form');
    const input = document.getElementById('resize-input');
    const widthInput = document.getElementById('resize-width');
    const heightInput = document.getElementById('resize-height');
    const previewContainer = document.getElementById('resize-preview');
    const previewImg = document.getElementById('resize-preview-img');
    const resultsContainer = document.getElementById('resize-results');

    initDragAndDrop('resize-input');
    showFileInfo('resize-input', 'resize-file-info');

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const width = parseInt(btn.dataset.width, 10);
            widthInput.value = width;
            heightInput.value = '';
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = input.files[0];
        if (!file) {
            showError(resultsContainer, 'Please select an image file');
            return;
        }

        const width = widthInput.value ? parseInt(widthInput.value, 10) : null;
        const height = heightInput.value ? parseInt(heightInput.value, 10) : null;

        if (!width && !height) {
            showError(resultsContainer, 'Please specify at least width or height');
            return;
        }

        resultsContainer.hidden = true;
        resultsContainer.innerHTML = '';

        try {
            const result = await resizeImage(file, width, height);

            // Show preview
            previewContainer.hidden = false;
            previewImg.src = URL.createObjectURL(result.blob);
            previewImg.onload = () => URL.revokeObjectURL(previewImg.src);

            // Show results
            resultsContainer.hidden = false;
            displayResizeResults(resultsContainer, result, file);

        } catch (error) {
            previewContainer.hidden = true;
            showError(resultsContainer, `Error: ${error.message}`);
        }
    });
}

function displayResizeResults(container, result, originalFile) {
    container.innerHTML = '';

    const h4 = document.createElement('h4');
    h4.textContent = 'Resized Image';
    container.appendChild(h4);

    const info = document.createElement('div');
    info.className = 'result-item-info';
    info.innerHTML = `
        <p><strong>Dimensions:</strong> ${result.width} × ${result.height}px</p>
        <p><strong>Original:</strong> ${formatFileSize(originalFile.size)}</p>
        <p><strong>Resized:</strong> ${formatFileSize(result.blob.size)}</p>
    `;

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.textContent = 'Download Resized Image';
    downloadBtn.addEventListener('click', () => {
        downloadBlob(result.blob, result.filename);
    });

    container.appendChild(info);
    container.appendChild(downloadBtn);
}

// Image Compress Tool
function initCompressTool() {
    const form = document.getElementById('compress-form');
    const input = document.getElementById('compress-input');
    const qualitySlider = document.getElementById('compress-quality');
    const qualityValue = document.getElementById('compress-quality-value');
    const formatSelect = document.getElementById('compress-format');
    const statsContainer = document.getElementById('compress-stats');
    const resultsContainer = document.getElementById('compress-results');

    initDragAndDrop('compress-input');
    showFileInfo('compress-input', 'compress-file-info');

    // Update quality display
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = input.files[0];
        if (!file) {
            showError(resultsContainer, 'Please select an image file');
            return;
        }

        const quality = parseInt(qualitySlider.value, 10) / 100; // Convert to 0-1 range
        const format = formatSelect.value;

        statsContainer.hidden = true;
        resultsContainer.hidden = true;
        resultsContainer.innerHTML = '';

        try {
            const result = await compressImage(file, quality, format);

            // Show stats
            statsContainer.hidden = false;
            document.getElementById('compress-original-size').textContent = formatFileSize(result.originalSize);
            document.getElementById('compress-compressed-size').textContent = formatFileSize(result.compressedSize);
            
            const reduction = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1);
            document.getElementById('compress-reduction').textContent = `${reduction}%`;

            // Show results
            resultsContainer.hidden = false;
            displayCompressResults(resultsContainer, result, file);

        } catch (error) {
            statsContainer.hidden = true;
            showError(resultsContainer, `Error: ${error.message}`);
        }
    });
}

function displayCompressResults(container, result, originalFile) {
    container.innerHTML = '';

    const h4 = document.createElement('h4');
    h4.textContent = 'Compressed Image';
    container.appendChild(h4);

    const preview = document.createElement('img');
    preview.src = URL.createObjectURL(result.blob);
    preview.alt = 'Compressed image preview';
    preview.style.maxWidth = '300px';
    preview.style.marginBottom = '1rem';
    preview.onload = () => URL.revokeObjectURL(preview.src);

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.textContent = 'Download Compressed Image';
    downloadBtn.addEventListener('click', () => {
        downloadBlob(result.blob, result.filename);
    });

    container.appendChild(preview);
    container.appendChild(downloadBtn);
}

// Utility function to show errors
function showError(container, message) {
    container.hidden = false;
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

// Initialize tab navigation
function initToolTabs() {
    const tabs = document.querySelectorAll('.tool-tab');
    const toolCards = document.querySelectorAll('.tool-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTool = tab.dataset.tool;

            // Remove active class from all tabs
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });

            // Hide all tool cards
            toolCards.forEach(card => {
                card.classList.remove('active');
                card.hidden = true;
            });

            // Activate clicked tab
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            // Show target tool card
            const targetCard = document.getElementById(targetTool);
            if (targetCard) {
                targetCard.classList.add('active');
                targetCard.hidden = false;
            }
        });
    });
}

// Initialize menu toggle
function initMenuToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const menuDropdown = document.getElementById('menu-dropdown');
    const menuContainer = menuToggle ? menuToggle.closest('.menu-container') : null;
    
    if (!menuToggle || !menuDropdown || !menuContainer) {
        return;
    }
    
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menuDropdown.classList.contains('show');
        
        if (isOpen) {
            menuDropdown.classList.remove('show');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuDropdown.setAttribute('aria-hidden', 'true');
        } else {
            menuDropdown.classList.add('show');
            menuToggle.setAttribute('aria-expanded', 'true');
            menuDropdown.setAttribute('aria-hidden', 'false');
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuContainer.contains(e.target)) {
            menuDropdown.classList.remove('show');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuDropdown.setAttribute('aria-hidden', 'true');
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuDropdown.classList.contains('show')) {
            menuDropdown.classList.remove('show');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuDropdown.setAttribute('aria-hidden', 'true');
            menuToggle.focus();
        }
    });
}

// Initialize all tools when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initMenuToggle();
    initToolTabs();
    initPdfTool();
    initResizeTool();
    initCompressTool();
});

