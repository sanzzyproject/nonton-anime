const API_URL = '/api';

const app = {
    currentAnimeEpisodes: [], 
    currentEpisodeIndex: -1, 

    init: () => {
        app.loadHome();
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
            return null;
        }
    },

    loadHome: async () => {
        app.setLoading(true);
        const data = await app.fetchData({ action: 'home' });
        if (!data) return;

        let html = '';
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
        let html = `<h2 class="section-title">Hasil: ${query}</h2><div class="anime-grid">`;
        if (data && data.length > 0) {
            data.forEach(item => html += app.createCard(item));
        } else {
            html += `<p style="padding:20px; color:gray">Tidak ditemukan.</p>`;
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

        // Simpan episode untuk navigasi
        app.currentAnimeEpisodes = data.episodes; 

        let html = `
            <div class="detail-header">
                <img src="${data.imageUrl}" class="detail-poster" referrerpolicy="no-referrer">
                <div class="detail-info">
                    <h1>${data.title}</h1>
                    <p style="color:var(--text-secondary); margin-bottom:10px;">${data.status} • ${data.studio}</p>
                    <p class="desc">${data.description}</p>
                </div>
            </div>
            
            <div class="ep-header">
                <h2 class="section-title" style="margin:0">List Episode</h2>
                <span style="font-size:0.8rem; color:var(--text-secondary)">Total: ${data.episodes.length}</span>
            </div>
            
            <div class="episode-container">
                <div class="episode-grid">
        `;

        data.episodes.forEach((ep, index) => {
            html += `<div class="ep-box" onclick="app.loadStream('${ep.url}', ${index})">${ep.number}</div>`;
        });

        html += `</div></div>`;
        document.getElementById('app').innerHTML = html;
        window.scrollTo(0, 0);
    },

    loadStream: async (url, index) => {
        app.currentEpisodeIndex = index;
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('videoPlayer');
        const serverList = document.getElementById('serverList');
        
        modal.classList.remove('hidden');
        document.getElementById('modalTitle').innerText = 'Memuat Video...';
        serverList.innerHTML = '<span style="color:var(--accent)">Mencari server...</span>';
        player.src = ''; 
        document.getElementById('navControls').style.display = 'none';

        const data = await app.fetchData({ action: 'stream', url });
        
        if (data && data.streamingServers.length > 0) {
            document.getElementById('modalTitle').innerText = data.title;
            
            // Buttons Server
            let serverHtml = '';
            data.streamingServers.forEach((srv, idx) => {
                serverHtml += `<button class="server-btn ${idx === 0 ? 'active' : ''}" onclick="app.changeServer(this, '${srv.link}')">${srv.server}</button>`;
            });
            serverList.innerHTML = serverHtml;

            // Auto play
            player.src = data.streamingServers[0].link;
            
            // Update tombol Next/Prev
            app.updateNavButtons();
        } else {
            serverList.innerHTML = 'Link stream belum tersedia.';
        }
    },

    updateNavButtons: () => {
        document.getElementById('navControls').style.display = 'flex';
        
        // Logika: Biasanya array episode itu [Ep 10, Ep 9, ... Ep 1] (Descending)
        // Jadi "Next Episode" (Ep 11) adalah index - 1 (ke arah atas array)
        // "Prev Episode" (Ep 9) adalah index + 1 (ke arah bawah array)
        // TERGANTUNG urutan dari web sumbernya.
        
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');

        // Cek bounds
        const canGoNext = app.currentEpisodeIndex > 0; 
        const canGoPrev = app.currentEpisodeIndex < app.currentAnimeEpisodes.length - 1;

        // Kita asumsi urutan Descending (Newest first) seperti standar web anime
        btnNext.onclick = () => {
             if(canGoNext) app.loadStream(app.currentAnimeEpisodes[app.currentEpisodeIndex - 1].url, app.currentEpisodeIndex - 1);
        };
        
        btnPrev.onclick = () => {
             if(canGoPrev) app.loadStream(app.currentAnimeEpisodes[app.currentEpisodeIndex + 1].url, app.currentEpisodeIndex + 1);
        };

        btnNext.disabled = !canGoNext;
        btnPrev.disabled = !canGoPrev;
    },

    changeServer: (btn, link) => {
        document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('videoPlayer').src = link;
    },

    closeModal: () => {
        document.getElementById('videoModal').classList.add('hidden');
        document.getElementById('videoPlayer').src = '';
    }
};

app.init();
