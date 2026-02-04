const API_URL = '/api';

const app = {
    init: () => {
        app.loadHome();
        // Enter key di search
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') app.handleSearch();
        });
    },

    setLoading: (isLoading) => {
        const container = document.getElementById('app');
        if (isLoading) container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    },

    fetchData: async (params) => {
        try {
            const url = new URL(window.location.origin + API_URL);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            const res = await fetch(url);
            return await res.json();
        } catch (err) {
            console.error(err);
            alert('Gagal memuat data. Silakan coba lagi.');
            return null;
        }
    },

    loadHome: async () => {
        app.setLoading(true);
        const data = await app.fetchData({ action: 'home' });
        if (!data) return;

        let html = '';

        // Slider Section
        if (data.slide && data.slide.length > 0) {
            html += `<h2 class="section-title">Trending</h2><div class="hero-slider">`;
            data.slide.forEach(item => {
                html += `
                    <div class="hero-card" onclick="app.loadDetail('${item.url}')">
                        <img src="${item.image}" referrerpolicy="no-referrer">
                        <div class="hero-content">
                            <h3>${item.title}</h3>
                            <p style="font-size: 0.8rem; opacity: 0.8">${item.status}</p>
                        </div>
                    </div>`;
            });
            html += `</div>`;
        }

        // Terbaru
        html += `<h2 class="section-title">Rilisan Terbaru</h2><div class="anime-grid">`;
        data.rilisanTerbaru.forEach(item => {
            html += app.createCard(item);
        });
        html += `</div>`;

        document.getElementById('app').innerHTML = html;
    },

    handleSearch: async () => {
        const query = document.getElementById('searchInput').value;
        if (!query) return;
        
        app.setLoading(true);
        const data = await app.fetchData({ action: 'search', q: query });
        
        let html = `<h2 class="section-title">Hasil Pencarian: ${query}</h2><div class="anime-grid">`;
        if (data && data.length > 0) {
            data.forEach(item => html += app.createCard(item));
        } else {
            html += `<p>Tidak ditemukan.</p>`;
        }
        html += `</div>`;
        document.getElementById('app').innerHTML = html;
    },

    createCard: (item) => {
        return `
            <div class="anime-card" onclick="app.loadDetail('${item.url}')">
                ${item.episode ? `<div class="ep-badge">${item.episode}</div>` : ''}
                <img class="card-image" src="${item.image}" referrerpolicy="no-referrer" loading="lazy">
                <div class="card-info">
                    <div class="card-title">${item.title}</div>
                </div>
            </div>
        `;
    },

    loadDetail: async (url) => {
        app.setLoading(true);
        const data = await app.fetchData({ action: 'detail', url });
        if (!data) return;

        let html = `
            <div class="detail-header">
                <img src="${data.imageUrl}" class="detail-poster" referrerpolicy="no-referrer">
                <div class="detail-info">
                    <h1>${data.title}</h1>
                    <p style="color:var(--text-secondary); margin-bottom:10px;">${data.status} • ${data.studio}</p>
                    <p>${data.description.substring(0, 300)}...</p>
                </div>
            </div>
            
            <h2 class="section-title">Episode</h2>
            <div class="episode-list">
        `;

        // Sort episode agar yang terbaru di atas atau diurutkan sesuai selera
        data.episodes.forEach(ep => {
            html += `<div class="ep-btn" onclick="app.loadStream('${ep.url}')">${ep.number}</div>`;
        });

        html += `</div>`;
        document.getElementById('app').innerHTML = html;
        window.scrollTo(0, 0);
    },

    loadStream: async (url) => {
        // Tampilkan loading di modal
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('videoPlayer');
        const serverList = document.getElementById('serverList');
        
        modal.classList.remove('hidden');
        document.getElementById('modalTitle').innerText = 'Memuat Player...';
        serverList.innerHTML = '<span style="color:white">Mengambil link stream...</span>';
        player.src = ''; // reset

        const data = await app.fetchData({ action: 'stream', url });
        
        if (data && data.streamingServers.length > 0) {
            document.getElementById('modalTitle').innerText = data.title;
            
            // Generate Server Buttons
            let serverHtml = '';
            data.streamingServers.forEach((srv, index) => {
                serverHtml += `<button class="server-btn ${index === 0 ? 'active' : ''}" onclick="app.changeServer(this, '${srv.link}')">${srv.server}</button>`;
            });
            serverList.innerHTML = serverHtml;

            // Auto play first server
            player.src = data.streamingServers[0].link;
        } else {
            serverList.innerHTML = 'Tidak ada stream yang tersedia.';
        }
    },

    changeServer: (btn, link) => {
        document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('videoPlayer').src = link;
    },

    closeModal: () => {
        document.getElementById('videoModal').classList.add('hidden');
        document.getElementById('videoPlayer').src = ''; // stop video
    }
};

// Start App
app.init();
