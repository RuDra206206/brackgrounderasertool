// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const editorContainer = document.getElementById('editorContainer');
const imageCanvas = document.getElementById('imageCanvas');
const ctx = imageCanvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const newColorInput = document.getElementById('newColor');
const addColorBtn = document.getElementById('addColorBtn');
const pickColorBtn = document.getElementById('pickColorBtn');
const toleranceSlider = document.getElementById('toleranceSlider');
const toleranceValue = document.getElementById('toleranceValue');
const featherSlider = document.getElementById('featherSlider');
const featherValue = document.getElementById('featherValue');
const eraseBgBtn = document.getElementById('eraseBgBtn');
const previewBtn = document.getElementById('previewBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const outputFormat = document.getElementById('outputFormat');
const spinner = document.getElementById('spinner');

// Global variables
let originalImage = null;
let isPickingColor = false;
const colorsToErase = [];

// Default colors
const defaultColors = [
    '#ffffff', '#f5f5f5', '#e0e0e0', 
    '#000000', '#212121', '#424242',
    '#4285f4', '#34a853', '#fbbc05', '#ea4335'
];

// Initialize default color options
defaultColors.forEach(color => {
    addColorOption(color);
});

// Event listeners
uploadSection.addEventListener('click', () => fileInput.click());
uploadSection.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSection.style.borderColor = 'var(--primary-color)';
    uploadSection.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
});

uploadSection.addEventListener('dragleave', () => {
    uploadSection.style.borderColor = 'var(--medium-gray)';
    uploadSection.style.backgroundColor = 'transparent';
});

uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSection.style.borderColor = 'var(--medium-gray)';
    uploadSection.style.backgroundColor = 'transparent';
    
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect(e);
    }
});

fileInput.addEventListener('change', handleFileSelect);
addColorBtn.addEventListener('click', addColorFromInput);
pickColorBtn.addEventListener('click', toggleColorPicker);
toleranceSlider.addEventListener('input', updateToleranceValue);
featherSlider.addEventListener('input', updateFeatherValue);
eraseBgBtn.addEventListener('click', eraseBackground);
previewBtn.addEventListener('click', previewErasedImage);
downloadBtn.addEventListener('click', downloadImage);
resetBtn.addEventListener('click', resetTool);

// Image click handler for color picking
imageCanvas.addEventListener('click', (e) => {
    try {
        if (!isPickingColor || !originalImage) return;
        
        const rect = imageCanvas.getBoundingClientRect();
        const scaleX = imageCanvas.width / rect.width;
        const scaleY = imageCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const color = rgbToHex(pixel[0], pixel[1], pixel[2]);
        
        addColorOption(color);
        toggleColorPicker();
    } catch (error) {
        console.error('Color picking error:', error);
        toggleColorPicker();
    }
});

// Functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('Please select an image file.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            originalImage = img;
            setupCanvas(img);
            editorContainer.style.display = 'block';
            uploadSection.style.display = 'none';
            downloadBtn.disabled = false;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function setupCanvas(img) {
    // Calculate dimensions to fit in container while maintaining aspect ratio
    const maxWidth = 800;
    const maxHeight = 600;
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
    }
    
    if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
    }
    
    // Set canvas dimensions
    imageCanvas.width = width;
    imageCanvas.height = height;
    
    // Draw the image
    ctx.drawImage(img, 0, 0, width, height);
}

function addColorOption(color) {
    // Validate color format
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
        console.error('Invalid color format:', color);
        return;
    }
    
    // Check if color already exists
    if (colorsToErase.includes(color)) {
        // Highlight the existing color
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.color === color) {
                el.classList.add('active');
            }
        });
        return;
    }
    
    colorsToErase.push(color);
    
    const colorElement = document.createElement('div');
    colorElement.className = 'color-option';
    colorElement.style.backgroundColor = color;
    colorElement.dataset.color = color;
    
    // Add click handler to select color
    colorElement.addEventListener('click', function() {
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.remove('active');
        });
        this.classList.add('active');
    });
    
    // Add delete on right click
    colorElement.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        const index = colorsToErase.indexOf(color);
        if (index > -1) {
            colorsToErase.splice(index, 1);
        }
        this.remove();
    });
    
    colorPicker.appendChild(colorElement);
}

function addColorFromInput() {
    const color = newColorInput.value;
    addColorOption(color);
}

function toggleColorPicker() {
    isPickingColor = !isPickingColor;
    
    if (isPickingColor) {
        pickColorBtn.textContent = 'Click on Image';
        pickColorBtn.style.backgroundColor = 'var(--primary-color)';
        pickColorBtn.style.color = 'white';
        imageCanvas.style.cursor = 'crosshair';
    } else {
        pickColorBtn.textContent = 'Pick Color';
        pickColorBtn.style.backgroundColor = '';
        pickColorBtn.style.color = '';
        imageCanvas.style.cursor = '';
    }
}

function updateToleranceValue() {
    toleranceValue.textContent = toleranceSlider.value;
}

function updateFeatherValue() {
    featherValue.textContent = featherSlider.value;
}

function eraseBackground() {
    if (!originalImage || colorsToErase.length === 0) {
        alert('Please upload an image and select at least one color to erase.');
        return;
    }
    
    showSpinner(true);
    
    // Use setTimeout to allow UI to update before intensive operation
    setTimeout(() => {
        try {
            const tolerance = parseInt(toleranceSlider.value) / 100;
            const featherRadius = parseInt(featherSlider.value);
            
            // Create a temporary canvas for processing
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imageCanvas.width;
            tempCanvas.height = imageCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
            
            // Get image data
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            // Convert colors to erase to RGB for comparison
            const eraseColorsRgb = colorsToErase.map(hexToRgb);
            
            // Process each pixel
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Check if pixel color matches any erase color within tolerance
                const shouldErase = eraseColorsRgb.some(eraseColor => {
                    return colorDistance(r, g, b, eraseColor.r, eraseColor.g, eraseColor.b) <= tolerance;
                });
                
                if (shouldErase) {
                    // Set alpha to 0 (transparent)
                    data[i + 3] = 0;
                }
            }
            
            // Apply feathering if needed
            if (featherRadius > 0) {
                featherEdges(imageData, featherRadius);
            }
            
            // Put the processed data back
            tempCtx.putImageData(imageData, 0, 0);
            
            // Draw the result to the main canvas
            ctx.drawImage(tempCanvas, 0, 0);
            
            showSpinner(false);
        } catch (error) {
            console.error('Error erasing background:', error);
            alert('An error occurred while processing the image. Please try again.');
            showSpinner(false);
        }
    }, 100);
}

function previewErasedImage() {
    if (!originalImage) {
        alert('Please upload an image first.');
        return;
    }
    
    // Just redraw the original image
    ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
}

function downloadImage() {
    if (!originalImage) return;
    
    const format = outputFormat.value;
    let mimeType, extension;
    
    switch (format) {
        case 'jpeg':
            mimeType = 'image/jpeg';
            extension = 'jpg';
            break;
        case 'webp':
            mimeType = 'image/webp';
            extension = 'webp';
            break;
        case 'png':
        default:
            mimeType = 'image/png';
            extension = 'png';
    }
    
    // Create a temporary canvas to ensure we get the current state
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageCanvas.width;
    tempCanvas.height = imageCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // For JPEG, fill with white background first
    if (format === 'jpeg') {
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
    
    tempCtx.drawImage(imageCanvas, 0, 0);
    
    // Convert to data URL
    const dataURL = tempCanvas.toDataURL(mimeType, 0.92);
    
    // Create download link
    const link = document.createElement('a');
    link.download = `background-removed.${extension}`;
    link.href = dataURL;
    link.click();
}

function resetTool() {
    if (originalImage) {
        ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
    }
    
    // Reset color selection (keep the first one selected)
    document.querySelectorAll('.color-option').forEach((el, index) => {
        el.classList.toggle('active', index === 0);
    });
    
    // Reset sliders
    toleranceSlider.value = 10;
    toleranceValue.textContent = '10';
    featherSlider.value = 5;
    featherValue.textContent = '5';
    
    // Reset format
    outputFormat.value = 'png';
    
    // Exit color picking mode if active
    if (isPickingColor) {
        toggleColorPicker();
    }
}

function showSpinner(show) {
    spinner.style.display = show ? 'block' : 'none';
    eraseBgBtn.disabled = show;
    downloadBtn.disabled = show;
}

// Helper functions
function rgbToHex(r, g, b) {
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
    // Calculate Delta E distance in LAB color space (more perceptually accurate)
    const lab1 = rgbToLab(r1, g1, b1);
    const lab2 = rgbToLab(r2, g2, b2);
    
    // Calculate Delta E
    const deltaL = lab1[0] - lab2[0];
    const deltaA = lab1[1] - lab2[1];
    const deltaB = lab1[2] - lab2[2];
    
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB) / 100;
}

function rgbToLab(r, g, b) {
    // Convert RGB to XYZ
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    
    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
    
    // Convert XYZ to LAB
    const L = (116 * y) - 16;
    const A = 500 * (x - y);
    const B = 200 * (y - z);
    
    return [L, A, B];
}

function featherEdges(imageData, radius) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Create a copy of the original alpha channel
    const originalAlpha = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        originalAlpha[i / 4] = data[i + 3];
    }
    
    // Apply feathering
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            const originalA = originalAlpha[y * width + x];
            
            if (originalA === 0) continue; // Skip already transparent pixels
            
            // Check surrounding pixels within the radius
            let minAlpha = originalA;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const neighborAlpha = originalAlpha[ny * width + nx];
                        if (neighborAlpha === 0) {
                            // Calculate distance to this transparent pixel
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance <= radius) {
                                // Scale alpha based on distance
                                const scaledAlpha = originalA * (distance / radius);
                                if (scaledAlpha < minAlpha) {
                                    minAlpha = scaledAlpha;
                                }
                            }
                        }
                    }
                }
            }
            
            // Apply the new alpha value
            data[index + 3] = minAlpha;
        }
    }
}