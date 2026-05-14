/* ============================================
   FOODFINDER — app.js
   Main search page logic with Autocomplete & Geolocation
   ============================================ */

'use strict';

// ─── DARK MODE (runs immediately to prevent flash) ──────────────────────────
(function initTheme() {
    const saved = localStorage.getItem('foodfinder-theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : '';  // Same origin on Render

const CUISINE_EMOJIS = {
    italian: '🍕', pizza: '🍕', pasta: '🍝',
    chinese: '🥟', japanese: '🍱', sushi: '🍣',
    indian: '🍛', thai: '🌶️', mexican: '🌮',
    american: '🍔', burger: '🍔', bbq: '🥩',
    french: '🥐', mediterranean: '🥗', greek: '🫒',
    seafood: '🦞', fish: '🐟',
    cafe: '☕', dessert: '🍰', bakery: '🥖',
    bar: '🍺', pub: '🍻', steak: '🥩',
    korean: '🍜', vietnamese: '🍜', turkish: '🥙',
    default: '🍽'
};

// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
    currentPage: 0,
    pageSize: 20,
    totalPages: 0,
    totalElements: 0,
    sortBy: 'rated',
    lastSearch: {},
    userLat: null,
    userLon: null,
    debounceTimer: null,
    acTimer: null,
    activeSuggestionIndex: -1
};

// ─── DOM REFS ────────────────────────────────────────────────────────────────
const dom = {
    cuisineInput:    () => document.getElementById('cuisine-input'),
    dishInput:       () => document.getElementById('dish-input'),
    cuisineSugg:     () => document.getElementById('cuisine-suggestions'),
    dishSugg:        () => document.getElementById('dish-suggestions'),
    detectLocBtn:    () => document.getElementById('detect-location-btn'),
    locBtnText:      () => document.getElementById('location-btn-text'),
    searchBtn:       () => document.getElementById('search-btn'),
    locationStatus:  () => document.getElementById('location-status'),
    resultsSection:  () => document.getElementById('results-section'),
    resultsToolbar:  () => document.getElementById('results-toolbar'),
    resultsCount:    () => document.getElementById('results-count'),
    loading:         () => document.getElementById('loading-state'),
    emptyState:      () => document.getElementById('empty-state'),
    errorState:      () => document.getElementById('error-state'),
    errorMsg:        () => document.getElementById('error-message'),
    grid:            () => document.getElementById('restaurant-grid'),
    pagination:      () => document.getElementById('pagination'),
    sortButtons:     () => document.querySelectorAll('.sort-btn'),
    sortNearest:     () => document.getElementById('sort-nearest'),
    clearBtn:        () => document.getElementById('clear-search-btn'),
    retryBtn:        () => document.getElementById('retry-btn'),
};

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    restoreStateFromUrl();
    
    // Close autocompletes on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-wrapper')) {
            closeAllSuggestions();
        }
    });
});

function bindEvents() {
    dom.searchBtn().addEventListener('click', handleSearch);
    dom.clearBtn().addEventListener('click', clearSearch);
    dom.retryBtn().addEventListener('click', handleSearch);
    dom.detectLocBtn().addEventListener('click', detectLocation);

    // Dark mode toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('foodfinder-theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('foodfinder-theme', 'dark');
            }
        });
    }

    // Inputs Enter & Autocomplete
    [ { input: dom.cuisineInput(), sugg: dom.cuisineSugg(), type: 'cuisine' },
      { input: dom.dishInput(), sugg: dom.dishSugg(), type: 'dish' }
    ].forEach(({input, sugg, type}) => {
        
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.length < 2) {
                sugg.style.display = 'none';
                return;
            }
            clearTimeout(state.acTimer);
            state.acTimer = setTimeout(() => fetchSuggestions(type, val, sugg, input), 300);
        });

        input.addEventListener('keydown', (e) => {
            const items = sugg.querySelectorAll('.suggestion-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                state.activeSuggestionIndex++;
                if (state.activeSuggestionIndex >= items.length) state.activeSuggestionIndex = 0;
                highlightSuggestion(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                state.activeSuggestionIndex--;
                if (state.activeSuggestionIndex < 0) state.activeSuggestionIndex = items.length - 1;
                highlightSuggestion(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (state.activeSuggestionIndex > -1 && items.length > 0) {
                    items[state.activeSuggestionIndex].click();
                } else {
                    closeAllSuggestions();
                    handleSearch();
                }
            } else if (e.key === 'Escape') {
                closeAllSuggestions();
            }
        });
    });

    // Sort buttons
    dom.sortButtons().forEach(btn => {
        btn.addEventListener('click', () => {
            state.sortBy = btn.dataset.sort;
            state.currentPage = 0;
            dom.sortButtons().forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            handleSearch();
        });
    });

    // Quick filter buttons — cuisine
    document.querySelectorAll('.quick-filter-btn:not(.dish-filter)').forEach(btn => {
        btn.addEventListener('click', () => {
            dom.cuisineInput().value = btn.dataset.cuisine;
            dom.dishInput().value = '';
            handleSearch();
        });
    });

    // ─── FOOTER INTERACTIONS ────────────────────────────────────────────────
    function footerSearch(cuisine, dish, sort) {
        dom.cuisineInput().value = cuisine || '';
        dom.dishInput().value = dish || '';
        if (sort) {
            state.sortBy = sort;
            dom.sortButtons().forEach(b => {
                b.classList.toggle('active', b.dataset.sort === sort);
            });
        }
        state.currentPage = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => handleSearch(), 400);
    }

    // Footer cuisine links
    document.querySelectorAll('.footer-cuisine-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            footerSearch(link.dataset.cuisine, '', 'rated');
        });
    });

    // Footer quick links
    const footerActions = {
        'footer-top-rated': () => footerSearch('', '', 'rated'), // Global top rated
        'footer-cheapest': () => footerSearch('', '', 'cheapest'), // Global cheapest
        'footer-cafes': () => footerSearch('Cafe', '', 'rated'),
        'footer-desserts': () => footerSearch('Desserts', '', 'rated'),
    };
    Object.entries(footerActions).forEach(([id, handler]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', (e) => { e.preventDefault(); handler(); });
    });



    // Back to top
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function restoreStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cuisine') || params.get('dish') || params.get('userLat')) {
        if (params.get('cuisine')) dom.cuisineInput().value = params.get('cuisine');
        if (params.get('dish')) dom.dishInput().value = params.get('dish');
        if (params.get('userLat') && params.get('userLon')) {
            state.userLat = parseFloat(params.get('userLat'));
            state.userLon = parseFloat(params.get('userLon'));
            dom.detectLocBtn().classList.add('active');
            dom.locBtnText().textContent = 'Location Detected';
        }
        if (params.get('sort')) {
            state.sortBy = params.get('sort');
            dom.sortButtons().forEach(b => {
                b.classList.toggle('active', b.dataset.sort === state.sortBy);
            });
        }
        handleSearch();
    }
}

// ─── GEOLOCATION ─────────────────────────────────────────────────────────────
function detectLocation() {
    const btn = dom.detectLocBtn();
    const txt = dom.locBtnText();
    
    if (!navigator.geolocation) {
        showStatus('Geolocation is not supported by your browser', 'error');
        return;
    }

    btn.classList.add('loading');
    txt.textContent = 'Detecting...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            state.userLat = position.coords.latitude;
            state.userLon = position.coords.longitude;
            
            btn.classList.remove('loading');
            btn.classList.add('active');
            txt.textContent = 'Location Active';
            showStatus('Location detected successfully!', 'success');
            
            // Auto-sort to nearest if we have location
            state.sortBy = 'nearest';
            dom.sortButtons().forEach(b => b.classList.toggle('active', b.dataset.sort === 'nearest'));
            
            // If they already typed something, search automatically
            if (dom.cuisineInput().value || dom.dishInput().value) {
                handleSearch();
            }
        },
        (error) => {
            btn.classList.remove('loading');
            txt.textContent = 'Detect My Location';
            console.error(error);
            showStatus('Unable to detect location. Please allow permissions.', 'error');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

// ─── AUTOCOMPLETE ────────────────────────────────────────────────────────────
async function fetchSuggestions(type, query, suggDiv, inputEl) {
    try {
        const res = await fetch(`${API_BASE}/api/restaurants/suggestions?type=${type}&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.success && data.data && data.data.length > 0) {
            renderSuggestions(data.data, suggDiv, inputEl, query);
        } else {
            suggDiv.style.display = 'none';
        }
    } catch (e) {
        console.error('Autocomplete error', e);
        suggDiv.style.display = 'none';
    }
}

function renderSuggestions(items, suggDiv, inputEl, query) {
    suggDiv.innerHTML = '';
    state.activeSuggestionIndex = -1;
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        
        // Highlight matching part
        const regex = new RegExp(`(${query})`, 'gi');
        const highlighted = item.replace(regex, "<strong>$1</strong>");
        
        div.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>${highlighted}</span>
        `;
        
        div.addEventListener('click', () => {
            inputEl.value = item;
            closeAllSuggestions();
            handleSearch();
        });
        
        suggDiv.appendChild(div);
    });
    
    suggDiv.style.display = 'block';
}

function highlightSuggestion(items) {
    items.forEach(item => item.classList.remove('active'));
    if (state.activeSuggestionIndex >= 0 && state.activeSuggestionIndex < items.length) {
        items[state.activeSuggestionIndex].classList.add('active');
        items[state.activeSuggestionIndex].scrollIntoView({ block: 'nearest' });
    }
}

function closeAllSuggestions() {
    dom.cuisineSugg().style.display = 'none';
    dom.dishSugg().style.display = 'none';
    state.activeSuggestionIndex = -1;
}

// ─── SEARCH ──────────────────────────────────────────────────────────────────
function handleSearch() {
    closeAllSuggestions();
    
    const cuisine = dom.cuisineInput().value.trim();
    const dish = dom.dishInput().value.trim();

    // Validate: At least one field, or location, OR if a special sort is active (from footer)
    const isSpecialSearch = (state.sortBy === 'rated' || state.sortBy === 'cheapest');
    if (!cuisine && !dish && state.userLat == null && !isSpecialSearch) {
        showStatus('Please enter a dish, cuisine, or detect location to search.', 'error');
        return;
    }
    showStatus('', '');

    state.lastSearch = { cuisine, dish };

    // Update URL
    const params = new URLSearchParams();
    if (cuisine) params.set('cuisine', cuisine);
    if (dish) params.set('dish', dish);
    if (state.userLat) {
        params.set('userLat', state.userLat);
        params.set('userLon', state.userLon);
    }
    if (state.sortBy !== 'rated') params.set('sort', state.sortBy);
    window.history.replaceState({}, '', '?' + params.toString());

    fetchRestaurants();
}

async function fetchRestaurants(page = state.currentPage) {
    showLoading(true);
    hideAll();

    const { cuisine, dish } = state.lastSearch;

    const params = new URLSearchParams();
    if (cuisine) params.set('cuisine', cuisine);
    if (dish) params.set('dish', dish);
    if (state.userLat != null) {
        params.set('userLat', state.userLat);
        params.set('userLon', state.userLon);
    }
    params.set('sortBy', state.sortBy);
    params.set('page', page);
    params.set('size', state.pageSize);

    try {
        const response = await fetch(`${API_BASE}/api/restaurants/search?${params}`);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        showLoading(false);

        if (!data.success) {
            showError(data.error || 'Search failed. Please try again.');
            return;
        }

        const restaurants = data.data || [];
        state.totalElements = data.totalElements || 0;
        state.totalPages = data.totalPages || 0;
        state.currentPage = data.currentPage || 0;

        if (restaurants.length === 0) {
            showEmpty();
            return;
        }

        renderResults(restaurants);
        renderPagination();
        showToolbar();

    } catch (err) {
        console.error('Search error:', err);
        showLoading(false);
        showError(err.message || 'Failed to connect to server. Please try again.');
    }
}

// ─── RENDERING ───────────────────────────────────────────────────────────────
function renderResults(restaurants) {
    const grid = dom.grid();
    grid.innerHTML = '';

    restaurants.forEach((r, index) => {
        const card = createRestaurantCard(r, index);
        grid.appendChild(card);
    });
}

function createRestaurantCard(r, index) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.style.animationDelay = `${index * 0.05}s`;

    const cuisines = r.cuisineList || (r.cuisines ? r.cuisines.split(',').map(s => s.trim()) : []);
    const rating = r.averageRating || 0;
    const price = r.priceLabel || (r.approximateCost ? `Rs. ${r.approximateCost}` : 'Price N/A');
    const distanceText = r.distanceKm != null ? `${r.distanceKm.toFixed(1)} km` : '';
    const location = [r.locality, r.city].filter(Boolean).join(', ') || r.address || 'N/A';

    const FOOD_IMAGES = [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&q=80',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&q=80',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop&q=80',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&q=80',
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop&q=80',
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop&q=80',
        'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop&q=80',
        'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop&q=80'
    ];

    const seed = r.id || index;
    const imageUrl = FOOD_IMAGES[seed % FOOD_IMAGES.length];

    card.innerHTML = `
        <div class="card-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
            <div class="card-image-overlay"></div>
            ${rating > 0 ? `
                <div class="card-rating-badge">
                    <span class="rating-star">★</span>
                    <span>${r.ratingLabel || rating.toFixed(1)}</span>
                </div>` : ''}
            ${distanceText ? `<div class="card-distance">📍 ${distanceText}</div>` : ''}
        </div>
        <div class="card-body">
            <h3 class="card-name">${escHtml(r.restaurantName)}</h3>
            <div class="card-cuisines">
                ${cuisines.slice(0, 3).map(c => `<span class="cuisine-tag">${escHtml(c)}</span>`).join('')}
            </div>
            <div class="card-footer">
                <div>
                    <div class="card-price">${escHtml(price)}</div>
                    <div class="card-location">📍 ${escHtml(location)}</div>
                </div>
                <button class="btn-view" data-id="${r.id}">
                    View
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
        </div>
    `;

    card.addEventListener('click', () => goToDetails(r.id));
    return card;
}

function renderPagination() {
    const pag = dom.pagination();
    pag.innerHTML = '';

    if (state.totalPages <= 1) {
        pag.style.display = 'none';
        return;
    }

    pag.style.display = 'flex';

    const maxVisible = 7;
    const current = state.currentPage;
    const total = state.totalPages;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn prev-next';
    prevBtn.innerHTML = '← Prev';
    prevBtn.disabled = current === 0;
    prevBtn.addEventListener('click', () => { if (current > 0) goToPage(current - 1); });
    pag.appendChild(prevBtn);

    let pages = getPageNumbers(current, total, maxVisible);
    pages.forEach(p => {
        if (p === '...') {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '…';
            ellipsis.style.cssText = 'padding: 0 4px; color: #999; align-self: center;';
            pag.appendChild(ellipsis);
        } else {
            const btn = document.createElement('button');
            btn.className = `page-btn${p === current ? ' active' : ''}`;
            btn.textContent = p + 1;
            btn.addEventListener('click', () => goToPage(p));
            pag.appendChild(btn);
        }
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn prev-next';
    nextBtn.innerHTML = 'Next →';
    nextBtn.disabled = current === total - 1;
    nextBtn.addEventListener('click', () => { if (current < total - 1) goToPage(current + 1); });
    pag.appendChild(nextBtn);
}

function getPageNumbers(current, total, maxVisible) {
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i);
    const pages = [0];
    if (current > 3) pages.push('...');
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) pages.push(i);
    if (current < total - 4) pages.push('...');
    pages.push(total - 1);
    return pages;
}

function goToPage(page) {
    state.currentPage = page;
    fetchRestaurants(page);
    dom.resultsSection().scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────
function showLoading(show) {
    dom.loading().style.display = show ? 'block' : 'none';
    if (show) {
        dom.grid().innerHTML = '';
        dom.pagination().style.display = 'none';
        dom.resultsToolbar().style.display = 'none';
    }
}

function hideAll() {
    dom.emptyState().style.display = 'none';
    dom.errorState().style.display = 'none';
}

function showEmpty() {
    dom.emptyState().style.display = 'flex';
    dom.resultsToolbar().style.display = 'none';
    dom.pagination().style.display = 'none';
}

function showError(message) {
    dom.errorMsg().textContent = message;
    dom.errorState().style.display = 'flex';
    dom.resultsToolbar().style.display = 'none';
}

function showToolbar() {
    const t = dom.resultsToolbar();
    t.style.display = 'flex';
    dom.resultsCount().innerHTML = `
        Found <span>${state.totalElements.toLocaleString()}</span> restaurants
    `;
    
    // Disable nearest sort if no location
    if (state.userLat == null) {
        dom.sortNearest().disabled = true;
        dom.sortNearest().title = "Detect location to use this sort";
        if (state.sortBy === 'nearest') {
            state.sortBy = 'rated';
            dom.sortButtons().forEach(b => b.classList.toggle('active', b.dataset.sort === 'rated'));
        }
    } else {
        dom.sortNearest().disabled = false;
        dom.sortNearest().title = "";
    }
}

function showStatus(message, type) {
    const el = dom.locationStatus();
    el.textContent = message;
    el.className = `location-status ${type}`;
    if(message) setTimeout(() => { el.textContent = ''; el.className = 'location-status'; }, 4000);
}

function clearSearch() {
    dom.cuisineInput().value = '';
    dom.dishInput().value = '';
    state.userLat = null;
    state.userLon = null;
    dom.detectLocBtn().classList.remove('active');
    dom.locBtnText().textContent = 'Detect My Location';
    
    dom.grid().innerHTML = '';
    dom.pagination().style.display = 'none';
    dom.resultsToolbar().style.display = 'none';
    dom.emptyState().style.display = 'none';
    dom.errorState().style.display = 'none';
    state.currentPage = 0;
    state.lastSearch = {};
    window.history.replaceState({}, '', window.location.pathname);
}

function goToDetails(id) {
    window.location.href = `details.html?id=${id}`;
}

function getCuisineEmoji(cuisines) {
    if (!cuisines || cuisines.length === 0) return CUISINE_EMOJIS.default;
    const lower = cuisines[0].toLowerCase();
    for (const [key, emoji] of Object.entries(CUISINE_EMOJIS)) {
        if (lower.includes(key)) return emoji;
    }
    return CUISINE_EMOJIS.default;
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
