// Image Handling Module

function createImageSlot(index) {
    const container = document.getElementById('imagesContainer');
    
    const slotDiv = document.createElement('div');
    slotDiv.className = 'image-slot';
    slotDiv.id = `imageSlot${index}`;
    
    slotDiv.innerHTML = `
        <div class="slot-header">
            <span class="slot-title">Image ${index + 1}${index === 0 ? ' *' : ''}</span>
            ${index > 0 ? `<button type="button" class="remove-image-btn" onclick="removeImageSlot(${index})">✕ Remove</button>` : ''}
        </div>
        <div class="upload-options">
            <div class="file-upload">
                <input type="file" id="imageFile${index}" accept="image/*" ${index === 0 ? 'required' : ''} onchange="handleImageSelect(${index}, this)">
                <label for="imageFile${index}" class="file-upload-label">
                    📷 Select<br>
                    <small>From gallery</small>
                </label>
            </div>
            <div class="file-upload mobile-only">
                <input type="file" id="cameraFile${index}" accept="image/*" capture="environment" onchange="handleCameraCapture(${index}, this)">
                <label for="cameraFile${index}" class="file-upload-label">
                    📸 Take Photo<br>
                    <small>Use camera</small>
                </label>
            </div>
        </div>
        <div id="imagePreview${index}" class="image-preview"></div>
    `;
    
    container.appendChild(slotDiv);
    STATE.imageSlotCount++;
}

function handleImageSelect(index, input) {
    if (input.files && input.files[0]) {
        STATE.imageFiles[index] = input.files[0];
        previewImage(index, input.files[0]);
        
        const cameraInput = document.getElementById(`cameraFile${index}`);
        if (cameraInput) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(input.files[0]);
            cameraInput.files = dataTransfer.files;
        }
        
        if (index === 0 && STATE.imageSlotCount < CONFIG.MAX_IMAGES) {
            document.getElementById('addImageBtn').classList.remove('hidden');
        }
    }
}

function handleCameraCapture(index, input) {
    if (input.files && input.files[0]) {
        STATE.imageFiles[index] = input.files[0];
        previewImage(index, input.files[0]);
        
        const fileInput = document.getElementById(`imageFile${index}`);
        if (fileInput) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(input.files[0]);
            fileInput.files = dataTransfer.files;
        }
        
        if (index === 0 && STATE.imageSlotCount < CONFIG.MAX_IMAGES) {
            document.getElementById('addImageBtn').classList.remove('hidden');
        }
    }
}

function previewImage(index, file) {
    const preview = document.getElementById(`imagePreview${index}`);
    const slot = document.getElementById(`imageSlot${index}`);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview ${index + 1}">`;
        slot.classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

function addImageSlot() {
    if (STATE.imageSlotCount < CONFIG.MAX_IMAGES) {
        createImageSlot(STATE.imageSlotCount);
        
        if (STATE.imageSlotCount >= CONFIG.MAX_IMAGES) {
            document.getElementById('addImageBtn').classList.add('hidden');
        }
    }
}

function removeImageSlot(index) {
    const slot = document.getElementById(`imageSlot${index}`);
    if (slot) {
        slot.remove();
        STATE.imageFiles[index] = null;
        STATE.imageSlotCount--;
        
        if (STATE.imageSlotCount < CONFIG.MAX_IMAGES && STATE.imageFiles[0]) {
            document.getElementById('addImageBtn').classList.remove('hidden');
        }
    }
}

async function createImageCollage(images) {
    return new Promise((resolve, reject) => {
        try {
            const validImages = images.filter(img => img !== null && img !== undefined);
            
            if (validImages.length === 0) {
                reject(new Error('No valid images'));
                return;
            }

            if (validImages.length === 1) {
                resolve(validImages[0]);
                return;
            }

            const numImages = validImages.length;
            const cols = Math.ceil(Math.sqrt(numImages));
            const rows = Math.ceil(numImages / cols);

            const imageElements = [];
            let loadedCount = 0;

            validImages.forEach((file, index) => {
                const img = new Image();
                const reader = new FileReader();

                reader.onload = function(e) {
                    img.onload = function() {
                        imageElements[index] = img;
                        loadedCount++;

                        if (loadedCount === validImages.length) {
                            createCollage(imageElements, cols, rows, resolve, reject);
                        }
                    };
                    img.src = e.target.result;
                };

                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

        } catch (error) {
            reject(error);
        }
    });
}

function createCollage(images, cols, rows, resolve, reject) {
    try {
        let maxWidth = 0;
        let maxHeight = 0;
        
        images.forEach(img => {
            if (img.width > maxWidth) maxWidth = img.width;
            if (img.height > maxHeight) maxHeight = img.height;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = cols * maxWidth;
        canvas.height = rows * maxHeight;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        images.forEach((img, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            const x = col * maxWidth;
            const y = row * maxHeight;

            const offsetX = (maxWidth - img.width) / 2;
            const offsetY = (maxHeight - img.height) / 2;

            ctx.drawImage(img, x + offsetX, y + offsetY);

            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, maxWidth, maxHeight);
        });

        canvas.toBlob((blob) => {
            if (blob) {
                const collageFile = new File(
                    [blob], 
                    'collage.jpg', 
                    { type: 'image/jpeg' }
                );
                resolve(collageFile);
            } else {
                reject(new Error('Failed to create collage blob'));
            }
        }, 'image/jpeg', 0.95);

    } catch (error) {
        reject(error);
    }
}

// Initialize add image button
document.addEventListener('DOMContentLoaded', function() {
    const addBtn = document.getElementById('addImageBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addImageSlot);
    }
});
