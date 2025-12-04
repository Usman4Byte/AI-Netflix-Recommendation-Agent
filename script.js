/* script.js */

// 1. The Sample Video (Secure HTTPS link to avoid blocking)
const sampleVideoUrl = "https://bizzenith.com/wp-content/uploads/2025/07/MAIN_Bizzenith.mp4";

// Optional: automatically request fullscreen on open (user gesture may be required)
const AUTO_FULLSCREEN_ON_OPEN = false;

// 2. Movie Data (Titles to display)
const movies = [
    "Stranger Things", "The Witcher", "Money Heist", 
    "Spider-Man", "Dark", "Breaking Bad", 
    "Inception", "Avengers", "John Wick"
];

// 3. Function to create a single Video Card
function createVideoCard(title) {
    const card = document.createElement('div');
    card.className = 'video-card';

    // Create the video element
    const video = document.createElement('video');
    video.src = sampleVideoUrl;
    video.className = 'thumbnail-video';
    video.muted = true; // REQUIRED for autoplay to work
    video.loop = true;  // Video will repeat
    video.preload = 'metadata'; // Saves data, loads video only when needed

    // Create a title overlay (optional, looks nice)
    const titleOverlay = document.createElement('div');
    titleOverlay.className = 'card-title';
    titleOverlay.innerText = title;

    // --- HOVER LOGIC ---
    // Play on hover
    card.addEventListener('mouseenter', () => {
        // Promise handling prevents "The play() request was interrupted" errors
        var playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Play started
            }).catch(error => {
                // Auto-play was prevented
            });
        }
    });

    // Pause on mouse leave
    card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0; // Reset to start
    });

    // --- CLICK LOGIC: open full-frame player and record for personalization ---
    card.addEventListener('click', (e) => {
        // Prevent hover pause from interfering
        e.stopPropagation();

        // open overlay player with the video's src and title
        openPlayer(title, video.src);

        // record that this title was opened (for personalization later)
        recordWatch(title);
    });

    card.appendChild(video);
    card.appendChild(titleOverlay);
    
    return card;
}

// 4. Inject cards into the HTML containers
function populateAllRows() {
    const rows = document.querySelectorAll('.row-posters');
    
    // Loop through every row in your HTML
    rows.forEach(row => {
        // Add the movie cards to this row
        movies.forEach(movieTitle => {
            const card = createVideoCard(movieTitle);
            row.appendChild(card);
        });
    });
}

// Run the function
// --- NEW: Overlay player and watch recording functions ---

// Create overlay DOM once
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

    const player = document.createElement('video');
    player.id = 'overlay-video';
    player.className = 'overlay-video';
    player.controls = true;
    player.playsInline = true;
    // Netflix-like scaling
    player.style.objectFit = 'contain';
    player.style.background = 'black';

    container.appendChild(closeBtn);
    container.appendChild(titleEl);
    container.appendChild(player);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // clicking outside the container closes the overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePlayer();
    });
})();

function openPlayer(title, src) {
    const overlay = document.getElementById('video-overlay');
    const player = document.getElementById('overlay-video');
    const titleEl = document.getElementById('player-title');

    if (!overlay || !player || !titleEl) return;

    titleEl.innerText = title;
    player.src = src;
    player.currentTime = 0;
    player.muted = false;
    player.play().catch(()=>{ /* ignore play errors */ });

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden'; // prevent background scroll
    // hide top nav for immersive view
    const nav = document.getElementById('nav');
    if (nav) nav.style.display = 'none';

    // Optionally request browser fullscreen for the video element
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

// Run the function
populateAllRows();

// --- NEW: banner play opens full-page player like Netflix ---
const bannerPlayBtn = document.querySelector('.banner-button.play');
if (bannerPlayBtn) {
    bannerPlayBtn.addEventListener('click', () => {
        const bannerTitle = document.querySelector('.banner-title')?.innerText || 'Featured';
        openPlayer(bannerTitle, sampleVideoUrl);
        recordWatch(bannerTitle);
    });
}