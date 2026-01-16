const API_BASE_URL = 'http://localhost:5000/api';

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

// Build movies lookup (dynamic, no static categories)
const allMovies = [
    { display: "Spider Man", file: "spiderman" },
    { display: "Money Heist", file: "moneyhiest" },
    { display: "Peaky Blinders", file: "peakyblinder" },
    { display: "Dark", file: "dark" },
    { display: "The Notebook", file: "notebook" },
    { display: "The Day of the Jackal", file: "dayofjackal" },
    { display: "Tees Maar Khan", file: "tessmarkhan" },
    { display: "Transformers", file: "transformers" },
    { display: "Red Zone", file: "redzone" },
    { display: "Suits", file: "suits" },
    { display: "Miracle in Cell No 7", file: "miracle" },
    { display: "Maleficent", file: "maleficent" },
    { display: "Badla", file: "badla" },
    { display: "Stranger Things", file: "strangerthings" },
    { display: "The Crown", file: "thecrown" },
    { display: "Orange is the New Black", file: "orange" },
    { display: "Inception", file: "inception" },
    { display: "Intersteller", file: "intersteller" }
];

let movies = {};
let allMovieTitles = [];
function initializeMovies() {
    movies = {};
    allMovieTitles = [];
    allMovies.forEach(({ display, file }) => {
        movies[display] = {
            url: `assets/videos/${file}.mp4`,
            thumbnail: `assets/thumbnails/${file}.png`
        };
        allMovieTitles.push(display);
    });
}

// Preferences helpers
function getPreferences() {
    try { return JSON.parse(localStorage.getItem('movie_preferences') || '{}'); }
    catch { return {}; }
}
function savePreferences(p) {
    try { localStorage.setItem('movie_preferences', JSON.stringify(p)); } catch {}
}

// Fetch AI recommendations from backend
async function loadAIRecommendations() {
    try {
        const res = await fetch(`${API_BASE_URL}/get-recommendations`, { cache: 'no-store' });
        const data = await res.json();
        return data.recommendations || [];
    } catch (e) {
        console.warn('Failed to load AI recommendations:', e);
        return [];
    }
}


// Populate "Recommended For You" section (AI, top row, 12 movies, no overlays)
async function populateRecommendedForYou() {
    const container = document.getElementById('recommended-posters');
    if (!container) return;

    container.innerHTML = '<div class="loading-text">Loading recommendations...</div>';

    const recommendations = await loadAIRecommendations();

    container.innerHTML = '';

    if (recommendations.length === 0) {
        // Fallback: show first 12 movies in static order, sorted alphabetically
        const sortedTitles = [...allMovieTitles].sort();
        sortedTitles.slice(0, 12).forEach(title => {
            if (movies[title]) {
                container.appendChild(createPosterAI(title, movies[title].thumbnail));
            }
        });
        return;
    }

    // Always render recommendations in a deterministic order (sorted by title)
    const sortedRecs = [...recommendations].sort();
    sortedRecs.slice(0, 12).forEach(title => {
        if (movies[title]) {
            container.appendChild(createPosterAI(title, movies[title].thumbnail));
        }
    });
}

// For AI row: No overlays, just thumbnail and click
function createPosterAI(title, thumbnailSrc) {
    const card = document.createElement('div');
    card.className = 'video-card';

    const img = document.createElement('img');
    img.className = 'thumbnail-image';
    img.src = thumbnailSrc;
    img.alt = title;

    img.addEventListener('error', () => {
        card.style.backgroundColor = '#333';
        card.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-size:12px;text-align:center;padding:10px;">${title}</div>`;
    });

    card.addEventListener('click', async (e) => {
        // Track watch
        try {
            await fetch(`${API_BASE_URL}/track-watch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie: title })
            });
        } catch {}
        openPlayer(title, movies[title].url);
    });

    card.appendChild(img);
    return card;
}

// For static categories: overlays (title, like/dislike)
function createPosterStatic(title, thumbnailSrc) {
    const card = document.createElement('div');
    card.className = 'video-card';

    const img = document.createElement('img');
    img.className = 'thumbnail-image';
    img.src = thumbnailSrc;
    img.alt = title;

    img.addEventListener('error', () => {
        card.style.backgroundColor = '#333';
        card.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-size:12px;text-align:center;padding:10px;">${title}</div>`;
    });

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

    // Set initial button states
    const prefs = getPreferences()[title] || { liked: false, disliked: false };
    if (prefs.liked) likeBtn.classList.add('active');
    if (prefs.disliked) dislikeBtn.classList.add('active');

    likeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const p = getPreferences();
        const cur = p[title] || { liked: false, disliked: false };
        cur.liked = !cur.liked;
        if (cur.liked) cur.disliked = false;
        p[title] = cur;
        savePreferences(p);
        likeBtn.classList.toggle('active', cur.liked);
        dislikeBtn.classList.toggle('active', cur.disliked);
        try {
            await fetch(`${API_BASE_URL}/track-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie: title, liked: cur.liked, disliked: cur.disliked })
            });
        } catch {}
        populateRecommendedForYou();
    });

    dislikeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const p = getPreferences();
        const cur = p[title] || { liked: false, disliked: false };
        cur.disliked = !cur.disliked;
        if (cur.disliked) cur.liked = false;
        p[title] = cur;
        savePreferences(p);
        likeBtn.classList.toggle('active', cur.liked);
        dislikeBtn.classList.toggle('active', cur.disliked);
        try {
            await fetch(`${API_BASE_URL}/track-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie: title, liked: cur.liked, disliked: cur.disliked })
            });
        } catch {}
        populateRecommendedForYou();
    });

    card.addEventListener('click', async (e) => {
        if (e.target.closest('.card-actions')) return;
        // Track watch
        try {
            await fetch(`${API_BASE_URL}/track-watch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie: title })
            });
        } catch {}
        openPlayer(title, movies[title].url);
    });

    actionsOverlay.appendChild(likeBtn);
    actionsOverlay.appendChild(dislikeBtn);

    card.appendChild(img);
    card.appendChild(titleOverlay);
    card.appendChild(actionsOverlay);

    return card;
}

// Create poster element (video card structure)
function createPoster(title, thumbnailSrc) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    const img = document.createElement('img');
    img.className = 'thumbnail-image';
    img.src = thumbnailSrc;
    img.alt = title;
    
    // Handle image load error
    img.addEventListener('error', () => {
        card.style.backgroundColor = '#333';
        card.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-size:12px;text-align:center;padding:10px;">${title}</div>`;
    });
    
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
    
    // Set initial button states
    const prefs = getPreferences()[title] || { liked: false, disliked: false };
    if (prefs.liked) likeBtn.classList.add('active');
    if (prefs.disliked) dislikeBtn.classList.add('active');
    
    // Like click
    likeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const p = getPreferences();
        const cur = p[title] || { liked: false, disliked: false };
        cur.liked = !cur.liked;
        if (cur.liked) cur.disliked = false;
        p[title] = cur;
        savePreferences(p);
        likeBtn.classList.toggle('active', cur.liked);
        dislikeBtn.classList.toggle('active', cur.disliked);
        try {
            await fetch(`${API_BASE_URL}/track-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie: title, liked: cur.liked, disliked: cur.disliked })
            });
        } catch {}
        populateRecommendedForYou();
    });
    
    // Dislike click
    dislikeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const p = getPreferences();
        const cur = p[title] || { liked: false, disliked: false };
        cur.disliked = !cur.disliked;
        if (cur.disliked) cur.liked = false;
        p[title] = cur;
        savePreferences(p);
        likeBtn.classList.toggle('active', cur.liked);
        dislikeBtn.classList.toggle('active', cur.disliked);
        try {
            await fetch(`${API_BASE_URL}/track-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie: title, liked: cur.liked, disliked: cur.disliked })
            });
        } catch {}
        populateRecommendedForYou();
    });
    
    actionsOverlay.appendChild(likeBtn);
    actionsOverlay.appendChild(dislikeBtn);
    
    // Card click to play
    card.addEventListener('click', async (e) => {
        if (e.target.closest('.card-actions')) return;
        // Track watch
        try {
            await fetch(`${API_BASE_URL}/track-watch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie: title })
            });
        } catch {}
        openPlayer(title, movies[title].url);
    });
    
    card.appendChild(img);
    card.appendChild(titleOverlay);
    card.appendChild(actionsOverlay);
    
    return card;
}


// Populate static category rows (with overlays)
function populateStaticRows() {
    Object.entries(categoryMovies).forEach(([category, movieList]) => {
        const idMap = {
            'Trending Now': 'trending-posters',
            'Top 10 Today': 'top10-posters',
            'Action Thrillers': 'action-posters',
        };
        const containerId = idMap[category];
        if (!containerId) return;
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        movieList.forEach(({ display, file }) => {
            if (movies[display]) {
                container.appendChild(createPosterStatic(display, movies[display].thumbnail));
            }
        });
    });
}

// Video overlay player
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

    const likeBtn = document.createElement('button');
    likeBtn.className = 'action-btn like-btn';
    likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    likeBtn.id = 'overlay-like-btn';

    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'action-btn dislike-btn';
    dislikeBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    dislikeBtn.id = 'overlay-dislike-btn';

    overlayActions.appendChild(likeBtn);
    overlayActions.appendChild(dislikeBtn);

    const player = document.createElement('video');
    player.id = 'overlay-video';
    player.className = 'overlay-video';
    player.controls = true;
    player.playsInline = true;

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

let currentMovieTitle = null;

function openPlayer(title, src) {
    currentMovieTitle = title;
    const overlay = document.getElementById('video-overlay');
    const player = document.getElementById('overlay-video');
    const titleEl = document.getElementById('player-title');
    const likeBtn = document.getElementById('overlay-like-btn');
    const dislikeBtn = document.getElementById('overlay-dislike-btn');

    if (!overlay || !player) return;

    titleEl.innerText = title;
    player.src = src;
    player.currentTime = 0;
    player.play().catch(() => {});

    // Update button states
    const prefs = getPreferences()[title] || { liked: false, disliked: false };
    likeBtn.classList.toggle('active', prefs.liked);
    dislikeBtn.classList.toggle('active', prefs.disliked);

    // Like handler
    likeBtn.onclick = async (e) => {
        e.stopPropagation();
        const p = getPreferences();
        const cur = p[title] || { liked: false, disliked: false };
        cur.liked = !cur.liked;
        if (cur.liked) cur.disliked = false;
        p[title] = cur;
        savePreferences(p);
        likeBtn.classList.toggle('active', cur.liked);
        dislikeBtn.classList.toggle('active', cur.disliked);
        try {
            await fetch(`${API_BASE_URL}/track-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie: title, liked: cur.liked, disliked: cur.disliked })
            });
        } catch {}
        // Refresh recommendations after preference change
        populateRecommendedForYou();
    };

    // Dislike handler
    dislikeBtn.onclick = async (e) => {
        e.stopPropagation();
        const p = getPreferences();
        const cur = p[title] || { liked: false, disliked: false };
        cur.disliked = !cur.disliked;
        if (cur.disliked) cur.liked = false;
        p[title] = cur;
        savePreferences(p);
        likeBtn.classList.toggle('active', cur.liked);
        dislikeBtn.classList.toggle('active', cur.disliked);
        try {
            await fetch(`${API_BASE_URL}/track-preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie: title, liked: cur.liked, disliked: cur.disliked })
            });
        } catch {}
        populateRecommendedForYou();
    };

    // Track watch progress
    let lastTime = 0, accum = 0;
    const onTimeUpdate = async () => {
        const t = player.currentTime || 0;
        if (t >= lastTime) {
            accum += (t - lastTime);
            lastTime = t;
            if (accum >= 5) {
                const chunk = Math.floor(accum);
                accum = 0;
                try {
                    await fetch(`${API_BASE_URL}/track-watch-progress`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ movie: title, seconds: chunk })
                    });
                } catch {}
            }
        } else {
            lastTime = t;
        }
    };
    player.removeEventListener('timeupdate', player._onTimeUpdate);
    player._onTimeUpdate = onTimeUpdate;
    player.addEventListener('timeupdate', onTimeUpdate);

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closePlayer() {
    const overlay = document.getElementById('video-overlay');
    const player = document.getElementById('overlay-video');
    if (!overlay || !player) return;
    player.pause();
    player.src = '';
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    // Refresh recommendations when closing player
    populateRecommendedForYou();
}

// Search functionality
function initializeSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    if (!searchBtn || !searchInput) return;

    searchBtn.addEventListener('click', () => {
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) searchInput.focus();
    });

    searchInput.addEventListener('input', async (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (q.length >= 2) {
            try {
                await fetch(`${API_BASE_URL}/track-search`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: q })
                });
            } catch {}
        }
    });
}

// Initialize on page load (AI + static rows)
document.addEventListener('DOMContentLoaded', async () => {
    initializeMovies();
    createOverlayElements();
    await populateRecommendedForYou();
    populateStaticRows();
    initializeSearch();
});