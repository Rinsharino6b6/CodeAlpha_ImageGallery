let model;
let galleryItems = [];
let currentCategory = 'all';
let currentIndex = 0;

// Initialize the Smart Vision System
async function initAI() {
    const statusText = document.querySelector('#ai-status span');
    try {
        // Load the MobileNet model
        model = await mobilenet.load();
        statusText.innerText = "Model Loaded. Analyzing images...";
        
        const images = document.querySelectorAll('.gallery-item img');
        galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
        
        let processedCount = 0;
        
        for (let i = 0; i < galleryItems.length; i++) {
            const item = galleryItems[i];
            const img = item.querySelector('img');
            
            // Ensure image is loaded before predicting
            if (img.complete) {
                await classifyImage(item, img);
            } else {
                img.onload = () => classifyImage(item, img);
            }
            
            processedCount++;
            statusText.innerText = `Analyzing images: ${processedCount}/${galleryItems.length}`;
        }
        
        document.getElementById('ai-status').innerHTML = '<span>⚡ Neural Network Active</span>';
        setupDynamicFilters();
        
    } catch (error) {
        console.error("AI Initialization failed:", error);
        statusText.innerText = "Error loading AI engine.";
    }
}

async function classifyImage(item, img) {
    const predictions = await model.classify(img);
    // Join the top predictions as tags
    const tags = predictions.map(p => p.className.toLowerCase()).join(', ');
    const primaryTag = predictions[0].className;
    
    item.dataset.tags = tags;
    item.querySelector('.ai-tag').innerText = primaryTag.split(',')[0];
    
    // Add click event for lightbox
    item.onclick = () => openLightbox(galleryItems.indexOf(item));
}

function setupDynamicFilters() {
    const categories = ['nature', 'cars', 'plants']; // Hardcoded base categories
    const filterBar = document.getElementById('category-filters');
    
    // You could also extract these from data-category attributes
}

// Search Functionality
document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.gallery-item');
    
    items.forEach(item => {
        const tags = item.dataset.tags || "";
        const category = item.dataset.category || "";
        const matches = tags.includes(query) || category.includes(query);
        
        item.style.display = (matches || query === "") ? "block" : "none";
    });
});

// Category Filtering
function filterByCategory(category) {
    currentCategory = category;
    
    // Update active button UI
    const btns = document.querySelectorAll('.filter-bar button');
    btns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const items = document.querySelectorAll('.gallery-item');
    items.forEach(item => {
        const itemCategory = item.dataset.category;
        if (category === 'all' || itemCategory === category) {
            item.style.display = "block";
        } else {
            item.style.display = "none";
        }
    });
}

// Lightbox Logic
function openLightbox(index) {
    currentIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const sourceImg = galleryItems[currentIndex].querySelector('img');
    
    lightboxImg.src = sourceImg.src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function changeImage(offset) {
    currentIndex = (currentIndex + offset + galleryItems.length) % galleryItems.length;
    
    // Skip hidden items when navigating in lightbox (optional but better UX)
    const items = Array.from(document.querySelectorAll('.gallery-item'));
    if (items[currentIndex].style.display === 'none') {
        changeImage(offset > 0 ? 1 : -1);
        return;
    }

    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = galleryItems[currentIndex].querySelector('img').src;
}

// Dynamic Image Addition Logic
document.getElementById('add-image-btn').addEventListener('click', async () => {
    const urlInput = document.getElementById('image-url-input');
    const url = urlInput.value.trim();
    
    if (!url) return;
    
    // Create new gallery item
    const gallery = document.getElementById('image-gallery');
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.category = 'uncategorized'; // Default category
    
    item.innerHTML = `
        <img src="${url}" crossorigin="anonymous" loading="lazy" />
        <div class="item-overlay"><span class="ai-tag">Analyzing...</span></div>
    `;
    
    // Add to gallery
    gallery.prepend(item);
    urlInput.value = '';
    
    // Analyze with AI
    const img = item.querySelector('img');
    
    // Wait for image to load to classify
    img.onload = async () => {
        await classifyImage(item, img);
        // Refresh gallery items list for lightbox/search
        galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    };
    
    img.onerror = () => {
        item.remove();
        alert("Could not load image. Please check the URL or ensure it allows cross-origin access.");
    };
});

// Start everything
window.onload = initAI;
