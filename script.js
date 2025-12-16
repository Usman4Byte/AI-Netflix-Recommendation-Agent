/* script.js - Clean Home Page without AI interference */

// Optional: automatically request fullscreen on open (user gesture may be required)
const AUTO_FULLSCREEN_ON_OPEN = false;

// 1. Category-based Movie Configuration
// TO ADD NEW MOVIES: Add entries to the appropriate category arrays
const categoryMovies = {
    "Trending Now": [
        // Add your trending movies here - file names should match assets/videos/{filename}.mp4
        { display: "Spider Man", file: "spiderman" },
        { display: "Money Heist", file: "moneyhiest" },
        { display: "Peaky Blinders", file: "peakyblinder" },
        { display: "Dark", file: "dark" },
        { display: "The Notebook", file: "notebook" },
        { display: "The Day of the Jackal", file: "dayofjackal" }
    ],
    "Top 10 Today": [
        // Add your top 10 movies here
        { display: "Tees Maar Khan", file: "tessmarkhan" },
        { display: "Transformers", file: "transformers" },
        { display: "Red Zone", file: "redzone" },
        { display: "Suits", file: "suits" },
        { display: "Miracle in Cell No 7", file: "miracle" },
        { display: "Maleficent", file: "maleficent" }
    ],
    "Action Thrillers": [
        // Add your action thrillers here
        { display: "Badla", file: "badla" },
        { display: "Stranger Things", file: "strangerthings" },
        { display: "The Crown", file: "thecrown" },
        { display: "Orange is the New Black", file: "orange" },
        { display: "Inception", file: "inception" },
        { display: "Intersteller", file: "intersteller" }
    ]
};

// Movies object - automatically populated from categoryMovies
let movies = {};
let allMovieTitles = [];

// Function to initialize movies from category configuration
function initializeMoviesFromCategories() {
    movies = {}; // Clear existing
    allMovieTitles = [];
    
    // Collect all movies from all categories
    Object.values(categoryMovies).forEach(categoryList => {
        categoryList.forEach(({ display, file }) => {
            if (!movies[display]) { // Avoid duplicates
                movies[display] = {
                    url: `assets/videos/${file}.mp4`,
                    thumbnail: `assets/thumbnails/${file}.png`
                };
                allMovieTitles.push(display);
            }
        });
    });
    
    console.log('Loaded movies from categories:', Object.keys(movies));
}

// Function to check if asset exists (for validation)
function checkAssetExists(url) {
    return new Promise((resolve) => {
        if (url.includes('.mp4')) {
            const video = document.createElement('video');
            video.onloadedmetadata = () => resolve(true);
            video.onerror = () => resolve(false);
            video.src = url;
        } else {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        }
        setTimeout(() => resolve(false), 2000);
    });
}

// Function to dynamically load only available movies
async function loadAvailableMovies() {
    const availableMovies = {};
    const availableTitles = [];
    
    // Check all movies from all categories
    for (const categoryList of Object.values(categoryMovies)) {
        for (const { display, file } of categoryList) {
            if (!availableMovies[display]) { // Avoid duplicates
                const videoPath = `assets/videos/${file}.mp4`;
                const thumbnailPath = `assets/thumbnails/${file}.png`;
                
                const videoExists = await checkAssetExists(videoPath);
                if (videoExists) {
                    availableMovies[display] = {
                        url: videoPath,
                        thumbnail: thumbnailPath
                    };
                    availableTitles.push(display);
                }
            }
        }
    }
    
    return { movies: availableMovies, titles: availableTitles };
}

// 2. Category Configuration - Each category shows exactly 6 movies
const categories = {
    "Trending Now": [
        "Stranger Things", "Wednesday", "Squid Game", 
        "The Queen's Gambit", "Cobra Kai", "The Umbrella Academy"
    ],
    "Top 10 Today": [
        "Money Heist", "Bridgerton", "Lucifer", 
        "The Witcher", "Ozark", "Mindhunter"
    ],
    "Action Thrillers": [
        "John Wick", "Spider-Man", "Avengers", 
        "Inception", "Breaking Bad", "Orange Is the New Black"
    ]
};





// 3. Function to create a single Video Card
function createVideoCard(title) {
    const card = document.createElement('div');
    card.className = 'video-card';

    const movieData = movies[title];
    if (!movieData) {
        console.warn(`Movie data not found for: ${title}`);
        return card;
    }

    // Create an image element for thumbnail instead of video
    const thumbnail = document.createElement('img');
    thumbnail.src = movieData.thumbnail;
    thumbnail.className = 'thumbnail-image';
    thumbnail.alt = title;
    
    // Handle thumbnail loading errors
    thumbnail.addEventListener('error', (e) => {
        console.warn(`Thumbnail failed to load: ${movieData.thumbnail}`);
        card.style.backgroundColor = '#333';
        card.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:12px;text-align:center;">${title}<br/>Thumbnail not found</div>`;
        return;
    });



    // Create a title overlay
    const titleOverlay = document.createElement('div');
    titleOverlay.className = 'card-title';
    titleOverlay.innerText = title;

    // Create like/dislike buttons
    const actionsOverlay = document.createElement('div');
    actionsOverlay.className = 'card-actions';
    
    const likeBtn = document.createElement('button');
    likeBtn.className = 'action-btn like-btn';
    likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    likeBtn.setAttribute('data-movie', title);
    
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'action-btn dislike-btn';
    dislikeBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    dislikeBtn.setAttribute('data-movie', title);

    // Update button states based on stored preferences
    updateActionButtons(title, likeBtn, dislikeBtn);

    // Like button click handler
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(title, likeBtn, dislikeBtn);
    });

    // Dislike button click handler
    dislikeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDislike(title, likeBtn, dislikeBtn);
    });

    actionsOverlay.appendChild(likeBtn);
    actionsOverlay.appendChild(dislikeBtn);

    // --- REMOVED HOVER VIDEO LOGIC ---
    // No hover events to play video - keeps static thumbnail

    // Click to open player
    card.addEventListener('click', (e) => {
        if (e.target.closest('.card-actions')) return;
        e.stopPropagation();
        
        openPlayer(title, movieData.url);
        recordWatch(title);
    });

    card.appendChild(thumbnail);
    card.appendChild(titleOverlay);
    card.appendChild(actionsOverlay);
    
    return card;
}

// 5. Like/Dislike functionality
function getPreferences() {
    try {
        const raw = localStorage.getItem('movie_preferences');
        return raw ? JSON.parse(raw) : {};
    } catch (err) {
        return {};
    }
}

function savePreferences(preferences) {
    try {
        localStorage.setItem('movie_preferences', JSON.stringify(preferences));
    } catch (err) {
        console.warn('Failed to save preferences', err);
    }
}

function toggleLike(title, likeBtn, dislikeBtn) {
    const preferences = getPreferences();
    const current = preferences[title] || { liked: false, disliked: false };
    
    current.liked = !current.liked;
    if (current.liked) current.disliked = false; // Can't like and dislike at same time
    
    preferences[title] = current;
    savePreferences(preferences);
    updateActionButtons(title, likeBtn, dislikeBtn);
    
    // Update overlay player buttons if open
    updateOverlayButtons(title);
}

function toggleDislike(title, likeBtn, dislikeBtn) {
    const preferences = getPreferences();
    const current = preferences[title] || { liked: false, disliked: false };
    
    current.disliked = !current.disliked;
    if (current.disliked) current.liked = false; // Can't like and dislike at same time
    
    preferences[title] = current;
    savePreferences(preferences);
    updateActionButtons(title, likeBtn, dislikeBtn);
    
    // Update overlay player buttons if open
    updateOverlayButtons(title);
}

function updateActionButtons(title, likeBtn, dislikeBtn) {
    const preferences = getPreferences();
    const current = preferences[title] || { liked: false, disliked: false };
    
    likeBtn.classList.toggle('active', current.liked);
    dislikeBtn.classList.toggle('active', current.disliked);
}

function updateOverlayButtons(title) {
    const overlayLikeBtn = document.getElementById('overlay-like-btn');
    const overlayDislikeBtn = document.getElementById('overlay-dislike-btn');
    
    if (overlayLikeBtn && overlayDislikeBtn) {
        updateActionButtons(title, overlayLikeBtn, overlayDislikeBtn);
    }
}

// 6. Search functionality
function initializeSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    searchBtn.addEventListener('click', () => {
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        }
    });
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterMovies(query);
    });
    
    searchInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (!searchInput.value.trim()) {
                searchInput.classList.remove('active');
                populateAllRows(); // Reset to normal view
            }
        }, 200);
    });
}

function filterMovies(query) {
    if (!query) {
        populateAllRows(); // Show all movies
        hideNoResultsMessage();
        return;
    }
    
    const filteredMovies = allMovieTitles.filter(movie => 
        movie.toLowerCase().includes(query)
    );
    
    if (filteredMovies.length === 0) {
        showNoResultsMessage(query);
        showRecommendedSection();
    } else {
        hideNoResultsMessage();
        populateSearchResults(filteredMovies);
    }
}

function showNoResultsMessage(query) {
    // Clear all existing rows
    const mainContent = document.querySelector('.main-content');
    const rows = document.querySelectorAll('.row');
    
    // Hide all existing rows
    rows.forEach(row => {
        row.style.display = 'none';
    });
    
    // Create or update no results message
    let noResultsSection = document.getElementById('no-results-section');
    if (!noResultsSection) {
        noResultsSection = document.createElement('div');
        noResultsSection.id = 'no-results-section';
        noResultsSection.className = 'no-results-section';
        mainContent.insertBefore(noResultsSection, mainContent.firstChild);
    }
    
    noResultsSection.innerHTML = `
        <div class="no-results-content">
            <i class="fas fa-search no-results-icon"></i>
            <h2 class="no-results-title">No videos found for "${query}"</h2>
            <p class="no-results-text">Try searching for something else or check out our recommendations below.</p>
        </div>
    `;
    
    noResultsSection.style.display = 'block';
}

function hideNoResultsMessage() {
    const noResultsSection = document.getElementById('no-results-section');
    if (noResultsSection) {
        noResultsSection.style.display = 'none';
    }
    
    // Show all existing rows again
    const rows = document.querySelectorAll('.row:not(#recommended-section)');
    rows.forEach(row => {
        row.style.display = 'block';
    });
}

function showRecommendedSection() {
    const mainContent = document.querySelector('.main-content');
    
    // Create or update recommended section
    let recommendedSection = document.getElementById('recommended-section');
    if (!recommendedSection) {
        recommendedSection = document.createElement('div');
        recommendedSection.id = 'recommended-section';
        recommendedSection.className = 'row recommended-section';
        
        const title = document.createElement('h2');
        title.textContent = 'Recommended for You';
        recommendedSection.appendChild(title);
        
        const postersContainer = document.createElement('div');
        postersContainer.className = 'row-posters';
        recommendedSection.appendChild(postersContainer);
        
        mainContent.appendChild(recommendedSection);
    }
    
    // Populate recommended section with random movies
    const postersContainer = recommendedSection.querySelector('.row-posters');
    postersContainer.innerHTML = '';
    
    const randomMovies = allMovieTitles.slice(0, 6); // Simple fallback to first 6 movies
    
    randomMovies.forEach(movieTitle => {
        const card = createVideoCard(movieTitle);
        postersContainer.appendChild(card);
    });
    
    recommendedSection.style.display = 'block';
}

function hideRecommendedSection() {
    const recommendedSection = document.getElementById('recommended-section');
    if (recommendedSection) {
        recommendedSection.style.display = 'none';
    }
}

function getWatchHistory() {
    try {
        const raw = localStorage.getItem('watched_counts_v1');
        return raw ? JSON.parse(raw) : {};
    } catch (err) {
        return {};
    }
}

// 7. Updated populate functions to work with categories
function populateAllRows() {
    hideNoResultsMessage();
    hideRecommendedSection();
    hideSearchResults();
    populateHomeTab();
}

function populateHomeTab() {
    const rowElements = document.querySelectorAll('.row:not(#no-results-section):not(#recommended-section)');
    
    // Show all normal rows
    rowElements.forEach(row => {
        row.style.display = 'block';
    });
    
    // Get category names from HTML and populate with category-specific movies
    const categoryElements = Array.from(rowElements).map(row => ({
        element: row,
        title: row.querySelector('h2')?.textContent || '',
        postersContainer: row.querySelector('.row-posters')
    }));
    
    // Populate each category with its specific movies
    categoryElements.forEach(({ element, title, postersContainer }) => {
        if (postersContainer && categoryMovies[title]) {
            postersContainer.innerHTML = '';
            categoryMovies[title].forEach(({ display }) => {
                if (movies[display]) {
                    const card = createVideoCard(display);
                    postersContainer.appendChild(card);
                }
            });
        }
    });
}



function populateSearchResults(movieList) {
    const mainContent = document.querySelector('.main-content');
    const existingRows = document.querySelectorAll('.row:not(#no-results-section):not(#recommended-section)');
    
    // Hide all existing category rows
    existingRows.forEach(row => {
        row.style.display = 'none';
    });
    
    // Create or update search results section
    let searchResultsSection = document.getElementById('search-results-section');
    if (!searchResultsSection) {
        searchResultsSection = document.createElement('div');
        searchResultsSection.id = 'search-results-section';
        searchResultsSection.className = 'row search-results';
        
        const title = document.createElement('h2');
        title.id = 'search-results-title';
        searchResultsSection.appendChild(title);
        
        const postersContainer = document.createElement('div');
        postersContainer.className = 'row-posters';
        postersContainer.id = 'search-results-posters';
        searchResultsSection.appendChild(postersContainer);
        
        mainContent.insertBefore(searchResultsSection, mainContent.firstChild);
    }
    
    // Update search results title
    const searchTitle = document.getElementById('search-results-title');
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    searchTitle.textContent = `Search Results for "${query}" (${movieList.length} found)`;
    
    // Populate search results with unique movies only
    const postersContainer = document.getElementById('search-results-posters');
    postersContainer.innerHTML = '';
    
    movieList.forEach(movieTitle => {
        if (movies[movieTitle]) {
            const card = createVideoCard(movieTitle);
            postersContainer.appendChild(card);
        }
    });
    
    searchResultsSection.style.display = 'block';
}

// Function to hide search results
function hideSearchResults() {
    const searchResultsSection = document.getElementById('search-results-section');
    if (searchResultsSection) {
        searchResultsSection.style.display = 'none';
    }
}

// Run the function
// --- Overlay player and watch recording functions ---
(function createOverlayElements(){
    if (document.getElementById('video-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'video-overlay';
    overlay.className = 'video-player-overlay';

    const container = document.createElement('div');
    container.className = 'video-player-container';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'player-close';
    closeBtn.innerText = '✕';
    closeBtn.addEventListener('click', closePlayer);

    const titleEl = document.createElement('div');
    titleEl.className = 'player-title';
    titleEl.id = 'player-title';

    // Add like/dislike buttons to overlay
    const overlayActions = document.createElement('div');
    overlayActions.className = 'overlay-actions';
    
    const overlayLikeBtn = document.createElement('button');
    overlayLikeBtn.className = 'action-btn like-btn';
    overlayLikeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    overlayLikeBtn.id = 'overlay-like-btn';
    
    const overlayDislikeBtn = document.createElement('button');
    overlayDislikeBtn.className = 'action-btn dislike-btn';
    overlayDislikeBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    overlayDislikeBtn.id = 'overlay-dislike-btn';
    
    overlayActions.appendChild(overlayLikeBtn);
    overlayActions.appendChild(overlayDislikeBtn);

    const player = document.createElement('video');
    player.id = 'overlay-video';
    player.className = 'overlay-video';
    player.controls = true;
    player.playsInline = true;
    player.style.objectFit = 'contain';
    player.style.background = 'black';

    container.appendChild(closeBtn);
    container.appendChild(titleEl);
    container.appendChild(overlayActions);
    container.appendChild(player);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePlayer();
    });
})();

function openPlayer(title, src) {
    const overlay = document.getElementById('video-overlay');
    const player = document.getElementById('overlay-video');
    const titleEl = document.getElementById('player-title');
    const overlayLikeBtn = document.getElementById('overlay-like-btn');
    const overlayDislikeBtn = document.getElementById('overlay-dislike-btn');

    if (!overlay || !player || !titleEl) return;

    titleEl.innerText = title;
    player.src = src;
    player.currentTime = 0;
    player.muted = false;
    player.play().catch((error) => {
        console.warn('Video play failed in overlay:', error);
    });

    // Update overlay action buttons
    updateActionButtons(title, overlayLikeBtn, overlayDislikeBtn);
    
    // Add event listeners for overlay buttons
    overlayLikeBtn.onclick = (e) => {
        e.stopPropagation();
        toggleLike(title, overlayLikeBtn, overlayDislikeBtn);
    };
    
    overlayDislikeBtn.onclick = (e) => {
        e.stopPropagation();
        toggleDislike(title, overlayLikeBtn, overlayDislikeBtn);
    };

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const nav = document.getElementById('nav');
    if (nav) nav.style.display = 'none';

    if (AUTO_FULLSCREEN_ON_OPEN && player.requestFullscreen) {
        player.requestFullscreen().catch(()=>{});
    }
}

function closePlayer() {
    const overlay = document.getElementById('video-overlay');
    const player = document.getElementById('overlay-video');

    if (!overlay || !player) return;

    player.pause();
    player.src = '';
    overlay.classList.remove('open');
    document.body.style.overflow = ''; // restore scroll
    // restore nav visibility
    const nav = document.getElementById('nav');
    if (nav) nav.style.display = '';

    // exit fullscreen if we entered it
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(()=>{});
    }
}

// Simple localStorage-based watch recorder (can be replaced with API call)
function recordWatch(title) {
    // stored as: { "<title>": { count: N, last: timestamp }, ... }
    try {
        const key = 'watched_counts_v1';
        const raw = localStorage.getItem(key);
        const data = raw ? JSON.parse(raw) : {};

        const now = Date.now();
        if (!data[title]) data[title] = { count: 0, last: null };
        data[title].count += 1;
        data[title].last = now;

        localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
        // fail silently
        console.warn('recordWatch failed', err);
    }
}

// Initialize clean home app
function initializeApp() {
    initializeMoviesFromCategories();
    
    console.log('Available movies:', Object.keys(movies));
    
    populateAllRows();
    initializeSearch();
}

// Start the app
initializeApp();

// Banner play button with AI tracking
const bannerPlayBtn = document.querySelector('.banner-button.play');
if (bannerPlayBtn) {
    bannerPlayBtn.addEventListener('click', () => {
        const bannerTitle = document.querySelector('.banner-title')?.innerText || 'Spider Man';
        const movieData = movies[bannerTitle];
        if (movieData) {
            openPlayer(bannerTitle, movieData.url);
            recordWatch(bannerTitle);
        } else {
            console.warn('Banner movie not found in assets');
        }
    });
}

