
/* AI Recommendations Page Script */

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Movie configuration (same as main page)
const categoryMovies = {
    "Trending Now": [
        { display: "Spider Man", file: "spiderman" },
        { display: "Money Heist", file: "moneyhiest" },
        { display: "Peaky Blinders", file: "peakyblinder" },
        { display: "Dark", file: "dark" },
        { display: "The Notebook", file: "notebook" },
        { display: "The Day of the Jackal", file: "dayofjackal" }
    ],
    "Top 10 Today": [
        { display: "Tees Maar Khan", file: "tessmarkhan" },
        { display: "Transformers", file: "transformers" },
        { display: "Red Zone", file: "redzone" },
        { display: "Suits", file: "suits" },
        { display: "Miracle in Cell No 7", file: "miracle" },
        { display: "Maleficent", file: "maleficent" }
    ],
    "Action Thrillers": [
        { display: "Badla", file: "badla" },
        { display: "Stranger Things", file: "strangerthings" },
        { display: "The Crown", file: "thecrown" },
        { display: "Orange is the New Black", file: "orange" },
        { display: "Inception", file: "inception" },
        { display: "Intersteller", file: "intersteller" }
    ]
};

let movies = {};
let allMovieTitles = [];
let aiRecommendations = [];
let userStats = {};

// Initialize movies from categories
function initializeMoviesFromCategories() {
    movies = {};
    allMovieTitles = [];
    
    Object.values(categoryMovies).forEach(categoryList => {
        categoryList.forEach(({ display, file }) => {
            if (!movies[display]) {
                movies[display] = {
                    url: `assets/videos/${file}.mp4`,
                    thumbnail: `assets/thumbnails/${file}.png`
                };
                allMovieTitles.push(display);
            }
        });
    });
    
    console.log('Loaded movies for recommendations:', Object.keys(movies));
}

// AI Backend Communication Functions
async function trackPreference(movie, liked, disliked) {
    try {
        const response = await fetch(`${API_BASE_URL}/track-preference`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                movie: movie,
                liked: liked,
                disliked: disliked
            })
        });
        
        if (response.ok) {
            console.log('Preference tracked successfully');
            await loadAIRecommendations();
            await loadUserStats();
        }
    } catch (error) {
        console.warn('Failed to track preference:', error);
    }
}

async function trackWatch(movie) {
    try {
        await fetch(`${API_BASE_URL}/track-watch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                movie: movie
            })
        });
        console.log('Watch tracked successfully');
        await loadUserStats();
    } catch (error) {
        console.warn('Failed to track watch:', error);
    }
}

async function trackSearch(query) {
    try {
        await fetch(`${API_BASE_URL}/track-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query
            })
        });
        console.log('Search tracked successfully');
    } catch (error) {
        console.warn('Failed to track search:', error);
    }
}

async function loadAIRecommendations() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-recommendations`);
        if (response.ok) {
            const data = await response.json();
            aiRecommendations = data.recommendations || [];
            console.log('AI Recommendations loaded:', aiRecommendations);
            
            // If no AI recommendations, use fallback
            if (aiRecommendations.length === 0) {
                console.log('No AI recommendations found, using fallback');
                aiRecommendations = allMovieTitles.slice(0, 6);
            }
            
            populateAllRecommendationSections();
        }
    } catch (error) {
        console.warn('Failed to load AI recommendations:', error);
        console.log('Using fallback recommendations due to error');
        aiRecommendations = allMovieTitles.slice(0, 6);
        populateAllRecommendationSections();
    }
}

async function loadUserStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-user-stats`);
        if (response.ok) {
            const data = await response.json();
            userStats = data.stats || {};
            console.log('User stats loaded:', userStats);
            
            updateStatsDisplay();
            updateAIProgress();
        }
    } catch (error) {
        console.warn('Failed to load user stats:', error);
    }
}

// Create video card with AI enhancements
function createVideoCard(title, isAIRecommended = true, badgeText = 'AI Pick') {
    const card = document.createElement('div');
    card.className = 'video-card ai-recommended';

    const movieData = movies[title];
    if (!movieData) {
        console.warn(`Movie data not found for: ${title}`);
        return card;
    }

    // Thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.src = movieData.thumbnail;
    thumbnail.className = 'thumbnail-image';
    thumbnail.alt = title;
    
    thumbnail.addEventListener('error', (e) => {
        console.warn(`Thumbnail failed to load: ${movieData.thumbnail}`);
        card.style.backgroundColor = '#333';
        card.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:12px;text-align:center;">${title}<br/>Thumbnail not found</div>`;
        return;
    });

    // AI badge
    const aiBadge = document.createElement('div');
    aiBadge.className = 'ai-badge-card';
    aiBadge.innerHTML = `<i class="fas fa-robot"></i> ${badgeText}`;

    // Title overlay
    const titleOverlay = document.createElement('div');
    titleOverlay.className = 'card-title';
    titleOverlay.innerText = title;

    // Action buttons
    const actionsOverlay = document.createElement('div');
    actionsOverlay.className = 'card-actions';
    
    const likeBtn = document.createElement('button');
    likeBtn.className = 'action-btn like-btn';
    likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'action-btn dislike-btn';
    dislikeBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';

    // Update button states
    updateActionButtons(title, likeBtn, dislikeBtn);

    // Event listeners
    likeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const wasLiked = likeBtn.classList.contains('active');
        toggleLike(title, likeBtn, dislikeBtn);
        await trackPreference(title, !wasLiked, false);
    });

    dislikeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const wasDisliked = dislikeBtn.classList.contains('active');
        toggleDislike(title, likeBtn, dislikeBtn);
        await trackPreference(title, false, !wasDisliked);
    });

    // Click to play
    card.addEventListener('click', async (e) => {
        if (e.target.closest('.card-actions')) return;
        e.stopPropagation();
        
        await trackWatch(title);
        openPlayer(title, movieData.url);
        recordWatch(title);
    });

    actionsOverlay.appendChild(likeBtn);
    actionsOverlay.appendChild(dislikeBtn);

    card.appendChild(thumbnail);
    card.appendChild(aiBadge);
    card.appendChild(titleOverlay);
    card.appendChild(actionsOverlay);
    
    return card;
}

// Preference management functions
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
    if (current.liked) current.disliked = false;
    
    preferences[title] = current;
    savePreferences(preferences);
    updateActionButtons(title, likeBtn, dislikeBtn);
    updateOverlayButtons(title);
}

function toggleDislike(title, likeBtn, dislikeBtn) {
    const preferences = getPreferences();
    const current = preferences[title] || { liked: false, disliked: false };
    
    current.disliked = !current.disliked;
    if (current.disliked) current.liked = false;
    
    preferences[title] = current;
    savePreferences(preferences);
    updateActionButtons(title, likeBtn, dislikeBtn);
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

// Populate recommendation sections
function populateAllRecommendationSections() {
    populateTopPicks();
    populateGenreRecommendations();
    populateSimilarRecommendations();
    populateTrendingRecommendations();
    populateSurpriseRecommendations();
}

function populateTopPicks() {
    const container = document.getElementById('aiTopPicks');
    if (!container) {
        console.error('aiTopPicks container not found!');
        return;
    }
    
    container.innerHTML = '';
    
    let topPicks = [];
    
    if (aiRecommendations.length > 0) {
        topPicks = aiRecommendations.slice(0, 6);
    } else {
        // Fallback to all available movies
        topPicks = allMovieTitles.slice(0, 6);
        console.log('Using fallback movies for top picks:', topPicks);
    }
    
    if (topPicks.length === 0) {
        container.innerHTML = '<div class="loading-recommendations">🤖 No movies available</div>';
        return;
    }
    
    topPicks.forEach(movie => {
        if (movies[movie]) {
            const card = createVideoCard(movie, true, 'Top Pick');
            container.appendChild(card);
        } else {
            console.warn(`Movie not found in movies object: ${movie}`);
        }
    });
    
    console.log(`Populated ${topPicks.length} top picks`);
}

function populateGenreRecommendations() {
    const container = document.getElementById('aiGenrePicks');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Use different slice or fallback
    let genrePicks = [];
    if (aiRecommendations.length >= 8) {
        genrePicks = aiRecommendations.slice(2, 8);
    } else if (aiRecommendations.length > 0) {
        genrePicks = aiRecommendations.slice(0, Math.min(6, aiRecommendations.length));
    } else {
        genrePicks = allMovieTitles.slice(1, 7); // Different slice for variety
    }
    
    genrePicks.forEach(movie => {
        if (movies[movie]) {
            const card = createVideoCard(movie, true, 'Genre Match');
            container.appendChild(card);
        }
    });
    
    // Update the genre name in the header
    updateTopGenre();
}

function populateSimilarRecommendations() {
    const container = document.getElementById('aiSimilarPicks');
    if (!container) return;
    
    container.innerHTML = '';
    
    let similarPicks = [];
    if (aiRecommendations.length >= 7) {
        similarPicks = aiRecommendations.slice(1, 7);
    } else {
        similarPicks = allMovieTitles.slice(2, 8); // Another different slice
    }
    
    similarPicks.forEach(movie => {
        if (movies[movie]) {
            const card = createVideoCard(movie, true, 'Similar');
            container.appendChild(card);
        }
    });
}

function populateTrendingRecommendations() {
    const container = document.getElementById('aiTrendingPicks');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Mix AI recommendations with all movies for trending
    let trendingPicks = [];
    if (aiRecommendations.length >= 3) {
        trendingPicks = [...aiRecommendations.slice(0, 3), ...allMovieTitles.slice(0, 3)];
    } else {
        trendingPicks = allMovieTitles.slice(3, 9); // Different slice
    }
    
    // Remove duplicates
    trendingPicks = [...new Set(trendingPicks)].slice(0, 6);
    
    trendingPicks.forEach(movie => {
        if (movies[movie]) {
            const card = createVideoCard(movie, true, 'Trending');
            container.appendChild(card);
        }
    });
}

function populateSurpriseRecommendations() {
    const container = document.getElementById('aiSurprisePicks');
    container.innerHTML = '';
    
    // Random selection from all movies
    const shuffled = [...allMovieTitles].sort(() => 0.5 - Math.random());
    const surprisePicks = shuffled.slice(0, 6);
    surprisePicks.forEach(movie => {
        if (movies[movie]) {
            const card = createVideoCard(movie, true, 'Surprise');
            container.appendChild(card);
        }
    });
}

function updateTopGenre() {
    const preferences = getPreferences();
    const likedMovies = Object.keys(preferences).filter(movie => preferences[movie].liked);
    
    // Count genres from liked movies
    const genreCounts = {};
    likedMovies.forEach(movie => {
        // This would need actual movie genre data - for now using placeholder
        const genres = ['Action', 'Drama', 'Thriller', 'Comedy'];
        genres.forEach(genre => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
    });
    
    const topGenre = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a])[0] || 'Action';
    document.getElementById('topGenre').textContent = topGenre;
}

// Stats and progress functions
function updateStatsDisplay() {
    document.getElementById('likedCount').textContent = userStats.liked_movies || 0;
    document.getElementById('watchedCount').textContent = userStats.unique_watches || 0;
    document.getElementById('searchCount').textContent = userStats.total_searches || 0;
    
    // Calculate AI accuracy (placeholder formula)
    const accuracy = Math.min(90, (userStats.liked_movies * 15) + (userStats.unique_watches * 10));
    document.getElementById('aiAccuracy').textContent = `${accuracy}%`;
}

function updateAIProgress() {
    const totalInteractions = (userStats.liked_movies || 0) + (userStats.unique_watches || 0) + (userStats.total_searches || 0);
    
    const prefProgress = Math.min(100, (userStats.liked_movies || 0) * 20);
    const genreProgress = Math.min(100, totalInteractions * 5);
    const patternProgress = Math.min(100, (userStats.unique_watches || 0) * 15);
    
    document.getElementById('prefProgress').style.width = `${prefProgress}%`;
    document.getElementById('genreProgress').style.width = `${genreProgress}%`;
    document.getElementById('patternProgress').style.width = `${patternProgress}%`;
    
    updateAIInsights();
}

function updateAIInsights() {
    const insights = [];
    
    if (userStats.liked_movies > 0) {
        insights.push(`You've liked ${userStats.liked_movies} movies - I'm learning your taste!`);
    }
    
    if (userStats.unique_watches > 3) {
        insights.push(`Based on ${userStats.unique_watches} movies watched, I can see patterns in your preferences.`);
    }
    
    if (userStats.total_searches > 5) {
        insights.push(`Your ${userStats.total_searches} searches help me understand what you're looking for.`);
    }
    
    if (insights.length === 0) {
        insights.push('Start liking, watching, and searching to help me learn your preferences!');
    }
    
    const insightsList = document.getElementById('aiInsightsList');
    insightsList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
}

// Search functionality
function initializeSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    searchBtn.addEventListener('click', () => {
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        }
    });
    
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length >= 2) {
            await trackSearch(query);
            filterRecommendations(query);
        } else {
            populateAllRecommendationSections();
        }
    });
}

function filterRecommendations(query) {
    const filteredMovies = allMovieTitles.filter(movie => 
        movie.toLowerCase().includes(query)
    );
    
    // Update all sections with filtered results
    const sections = ['aiTopPicks', 'aiGenrePicks', 'aiSimilarPicks', 'aiTrendingPicks', 'aiSurprisePicks'];
    sections.forEach(sectionId => {
        const container = document.getElementById(sectionId);
        container.innerHTML = '';
        
        filteredMovies.slice(0, 6).forEach(movie => {
            if (movies[movie]) {
                const card = createVideoCard(movie, true, 'Match');
                container.appendChild(card);
            }
        });
        
        if (filteredMovies.length === 0) {
            container.innerHTML = '<div class="no-results">No matches found</div>';
        }
    });
}

// Video player (same as main page)
function createOverlayElements() {
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
}

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

    updateActionButtons(title, overlayLikeBtn, overlayDislikeBtn);
    
    overlayLikeBtn.onclick = async (e) => {
        e.stopPropagation();
        const wasLiked = overlayLikeBtn.classList.contains('active');
        toggleLike(title, overlayLikeBtn, overlayDislikeBtn);
        await trackPreference(title, !wasLiked, false);
    };
    
    overlayDislikeBtn.onclick = async (e) => {
        e.stopPropagation();
        const wasDisliked = overlayDislikeBtn.classList.contains('active');
        toggleDislike(title, overlayLikeBtn, overlayDislikeBtn);
        await trackPreference(title, false, !wasDisliked);
    };

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const nav = document.getElementById('nav');
    if (nav) nav.style.display = 'none';
}

function closePlayer() {
    const overlay = document.getElementById('video-overlay');
    const player = document.getElementById('overlay-video');

    if (!overlay || !player) return;

    player.pause();
    player.src = '';
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    const nav = document.getElementById('nav');
    if (nav) nav.style.display = '';

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(()=>{});
    }
}

function recordWatch(title) {
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
        console.warn('recordWatch failed', err);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing recommendations page');
    
    // Initialize movies first
    initializeMoviesFromCategories();
    console.log('Movies initialized:', Object.keys(movies).length);
    
    // Create video player overlay
    createOverlayElements();
    
    // Initialize search
    initializeSearch();
    
    // Load AI data - but don't wait if it fails
    try {
        await loadUserStats();
        await loadAIRecommendations();
    } catch (error) {
        console.warn('Failed to load AI data, using fallbacks:', error);
        // Populate with fallback data
        aiRecommendations = allMovieTitles.slice(0, 6);
        populateAllRecommendationSections();
    }
    
    // Set up UI event listeners
    setupUIEventListeners();
});

function setupUIEventListeners() {
    // AI Stats button
    const aiStatsBtn = document.getElementById('aiStatsBtn');
    const aiModal = document.getElementById('aiModal');
    const modalClose = document.getElementById('modalClose');
    
    if (aiStatsBtn && aiModal && modalClose) {
        aiStatsBtn.addEventListener('click', () => {
            aiModal.style.display = 'flex';
        });
        
        modalClose.addEventListener('click', () => {
            aiModal.style.display = 'none';
        });
        
        aiModal.addEventListener('click', (e) => {
            if (e.target === aiModal) {
                aiModal.style.display = 'none';
            }
        });
    }
    
    // AI Play button - plays top recommendation
    const aiPlayBtn = document.getElementById('aiPlayBtn');
    if (aiPlayBtn) {
        aiPlayBtn.addEventListener('click', async () => {
            let movieToPlay = null;
            
            if (aiRecommendations.length > 0) {
                movieToPlay = aiRecommendations[0];
            } else if (allMovieTitles.length > 0) {
                movieToPlay = allMovieTitles[0];
            }
            
            if (movieToPlay && movies[movieToPlay]) {
                await trackWatch(movieToPlay);
                openPlayer(movieToPlay, movies[movieToPlay].url);
                recordWatch(movieToPlay);
            } else {
                console.warn('No movies available to play');
            }
        });
    }
}