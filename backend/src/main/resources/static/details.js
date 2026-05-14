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

    const imageUrl = getRestaurantImage(r);
    const heroBanner = document.getElementById('detail-hero-banner');
    if (heroBanner) {
        heroBanner.style.backgroundImage = `url('${imageUrl}')`;
    }

    // Badges
    const badgesEl = document.getElementById('detail-badges');
    const cuisines = r.cuisineList || [];
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

    // Back to top
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Show content
    const detailLoading = document.getElementById('detail-loading');
    const detailContent = document.getElementById('detail-content');
    if (detailLoading) detailLoading.style.display = 'none';
    if (detailContent) detailContent.style.display = 'block';
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

/**
 * Smart image selection based on cuisine.
 */
function getRestaurantImage(r) {
    const cuisines = (r.cuisines || "").toLowerCase();
    
    const mapping = [
        { key: 'pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80' },
        { key: 'burger', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80' },
        { key: 'chinese', img: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=1200&q=80' },
        { key: 'indian', img: 'https://images.unsplash.com/photo-1517244681291-03973904c24b?w=1200&q=80' },
        { key: 'cafe', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80' },
        { key: 'coffee', img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80' },
        { key: 'dessert', img: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1200&q=80' },
        { key: 'biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80' },
        { key: 'south indian', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200&q=80' },
        { key: 'bar', img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80' },
        { key: 'bakery', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80' }
    ];

    for (const item of mapping) {
        if (cuisines.includes(item.key)) return item.img;
    }

    const fallbacks = [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80'
    ];
    return fallbacks[(r.id || 0) % fallbacks.length];
}
