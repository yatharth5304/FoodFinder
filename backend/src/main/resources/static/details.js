/* ============================================
   FOODFINDER — details.js
   Restaurant detail page logic
   ============================================ */

'use strict';

// ─── DARK MODE (runs immediately to prevent flash) ──────────────────────────
(function initTheme() {
    const saved = localStorage.getItem('foodfinder-theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : '';

const CUISINE_EMOJIS = {
    italian: '🍕', pizza: '🍕', pasta: '🍝',
    chinese: '🥟', japanese: '🍱', sushi: '🍣',
    indian: '🍛', thai: '🌶️', mexican: '🌮',
    american: '🍔', burger: '🍔', bbq: '🥩',
    french: '🥐', mediterranean: '🥗', greek: '🫒',
    seafood: '🦞', cafe: '☕', dessert: '🍰',
    bakery: '🥖', bar: '🍺', steak: '🥩',
    korean: '🍜', vietnamese: '🍜', turkish: '🥙',
    default: '🍽'
};

document.addEventListener('DOMContentLoaded', () => {
    // Dark mode toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('foodfinder-theme', isDark ? 'light' : 'dark');
    });

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id || isNaN(Number(id))) {
        showError();
        return;
    }

    loadRestaurant(id);
});

async function loadRestaurant(id) {
    try {
        const response = await fetch(`${API_BASE}/api/restaurants/${id}`);

        if (!response.ok) {
            showError();
            return;
        }

        const data = await response.json();

        if (!data.success || !data.data) {
            showError();
            return;
        }

        renderDetail(data.data);

    } catch (err) {
        console.error('Error loading restaurant:', err);
        showError();
    }
}

function renderDetail(r) {
    document.title = `${r.restaurantName} — FoodFinder`;

    const FOOD_IMAGES = [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=400&fit=crop&q=80',
        'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&h=400&fit=crop&q=80'
    ];

    const cuisines = r.cuisineList || [];
    const seed = r.id || 0;
    const imageUrl = FOOD_IMAGES[seed % FOOD_IMAGES.length];
    
    const heroBanner = document.getElementById('detail-hero-banner');
    if (heroBanner) {
        heroBanner.style.backgroundImage = `url('${imageUrl}')`;
    }

    // Badges
    const badgesEl = document.getElementById('detail-badges');
    const badges = [];
    if (cuisines.length > 0) {
        badges.push(...cuisines.slice(0, 3).map(c =>
            `<span class="detail-badge badge-cuisine">${escHtml(c)}</span>`
        ));
    }
    if (r.hasOnlineDelivery) {
        badges.push('<span class="detail-badge badge-delivery">🛵 Delivery</span>');
    }
    if (r.hasTableBooking) {
        badges.push('<span class="detail-badge badge-booking">📅 Table Booking</span>');
    }
    badgesEl.innerHTML = badges.join('');

    // Name
    document.getElementById('detail-name').textContent = r.restaurantName;

    // Meta
    const metaEl = document.getElementById('detail-meta');
    const metaParts = [];
    if (r.city) metaParts.push(`<span class="detail-meta-item">📍 ${escHtml(r.city)}</span>`);
    if (r.locality) metaParts.push(`<span class="detail-meta-item">🏘️ ${escHtml(r.locality)}</span>`);
    if (r.priceRange) metaParts.push(`<span class="detail-meta-item">${'💰'.repeat(r.priceRange)}</span>`);
    metaEl.innerHTML = metaParts.join('');

    // Quick facts
    const factsEl = document.getElementById('detail-quick-facts');
    const ratingStr = r.averageRating && r.averageRating > 0 ? r.averageRating.toFixed(1) : '—';
    const priceStr = r.priceLabel || (r.approximateCost ? `Rs. ${r.approximateCost}` : '—');
    const votesStr = r.ratingCount ? r.ratingCount.toLocaleString() : '—';

    factsEl.innerHTML = `
        <div class="quick-fact">
            <div class="quick-fact-value">⭐ ${ratingStr}</div>
            <div class="quick-fact-label">Rating</div>
        </div>
        <div class="quick-fact">
            <div class="quick-fact-value">${escHtml(priceStr)}</div>
            <div class="quick-fact-label">Avg Cost</div>
        </div>
        <div class="quick-fact">
            <div class="quick-fact-value">${votesStr}</div>
            <div class="quick-fact-label">Votes</div>
        </div>
    `;

    // About section
    const aboutEl = document.getElementById('detail-about');
    const aboutParts = [];
    if (r.cuisines) {
        aboutParts.push(`<p><strong>Cuisine:</strong> ${escHtml(r.cuisines)}</p>`);
    }
    if (r.address) {
        aboutParts.push(`<p><strong>Address:</strong> ${escHtml(r.address)}</p>`);
    }
    const locationStr = [r.locality, r.city, r.country].filter(Boolean).join(', ');
    if (locationStr) {
        aboutParts.push(`<p><strong>Location:</strong> ${escHtml(locationStr)}</p>`);
    }
    aboutEl.innerHTML = aboutParts.length > 0
        ? aboutParts.join('')
        : '<p>No additional information available for this restaurant.</p>';

    // Menu items
    const menuSection = document.getElementById('menu-section');
    const menuTagsEl = document.getElementById('menu-tags');
    if (r.menuItems && r.menuItems.trim()) {
        const items = r.menuItems.split(/[,|;]/).map(s => s.trim()).filter(Boolean);
        menuTagsEl.innerHTML = items.map(item =>
            `<span class="menu-tag">${escHtml(item)}</span>`
        ).join('');
        menuSection.style.display = '';
    } else {
        menuSection.style.display = 'none';
    }

    // Map
    const fullAddress = [r.address, r.locality, r.city, r.country].filter(Boolean).join(', ');
    document.getElementById('map-address').textContent = fullAddress || 'Address not available';

    const mapsLink = document.getElementById('maps-link');
    if (r.latitude && r.longitude) {
        mapsLink.href = `https://www.google.com/maps?q=${r.latitude},${r.longitude}`;
    } else if (fullAddress) {
        mapsLink.href = `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
    } else {
        mapsLink.href = `https://www.google.com/maps/search/${encodeURIComponent(r.restaurantName)}`;
    }

    // Rating card
    const bigRatingEl = document.getElementById('big-rating');
    const ratingBarEl = document.getElementById('rating-bar');
    const ratingVotesEl = document.getElementById('rating-votes');

    if (r.averageRating && r.averageRating > 0) {
        bigRatingEl.innerHTML = `<span>${r.averageRating.toFixed(1)}</span> <small style="font-size:28px;color:#999">/ 5</small>`;
        const pct = (r.averageRating / 5) * 100;
        ratingBarEl.innerHTML = `
            <div class="rating-bar-wrap">
                <div class="rating-bar-fill" style="width: ${pct}%"></div>
            </div>
        `;
        ratingVotesEl.textContent = r.ratingCount ? `Based on ${r.ratingCount.toLocaleString()} votes` : '';
    } else {
        bigRatingEl.innerHTML = '<span style="color:#ccc">N/R</span>';
        ratingVotesEl.textContent = 'Not yet rated';
    }

    // Info list
    const infoListEl = document.getElementById('info-list');
    const infoItems = [];

    if (r.city || r.country) {
        infoItems.push({
            icon: '🌍',
            label: 'Location',
            value: [r.city, r.country].filter(Boolean).join(', ')
        });
    }
    if (r.approximateCost) {
        infoItems.push({
            icon: '💰',
            label: 'Avg Cost for Two',
            value: r.priceLabel || `${r.currency || 'Rs. '}${r.approximateCost}`
        });
    }
    if (r.hasOnlineDelivery !== null && r.hasOnlineDelivery !== undefined) {
        infoItems.push({
            icon: '🛵',
            label: 'Online Delivery',
            value: r.hasOnlineDelivery ? 'Available' : 'Not Available'
        });
    }
    if (r.hasTableBooking !== null && r.hasTableBooking !== undefined) {
        infoItems.push({
            icon: '📅',
            label: 'Table Booking',
            value: r.hasTableBooking ? 'Available' : 'Not Available'
        });
    }
    if (r.cuisines) {
        infoItems.push({
            icon: '🍴',
            label: 'Cuisines',
            value: r.cuisines
        });
    }

    infoListEl.innerHTML = infoItems.map(item => `
        <li>
            <span class="info-icon">${item.icon}</span>
            <div>
                <span class="info-label">${escHtml(item.label)}</span>
                <span class="info-value">${escHtml(String(item.value))}</span>
            </div>
        </li>
    `).join('');

    // Share button
    document.getElementById('share-btn').addEventListener('click', async () => {
        const shareData = {
            title: `${r.restaurantName} — FoodFinder`,
            text: `Check out ${r.restaurantName} on FoodFinder!`,
            url: window.location.href
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (e) {
                fallbackCopy(window.location.href);
            }
        } else {
            fallbackCopy(window.location.href);
        }
    });

    // Show content
    document.getElementById('detail-loading').style.display = 'none';
    document.getElementById('detail-content').style.display = 'block';
}

function fallbackCopy(text) {
    navigator.clipboard?.writeText(text)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Could not copy link. Share URL:\n' + text));
}

function showError() {
    document.getElementById('detail-loading').style.display = 'none';
    document.getElementById('detail-error').style.display = 'flex';
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
