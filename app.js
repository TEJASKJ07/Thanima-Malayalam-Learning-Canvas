class SoundFX {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playStroke() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180 + Math.random() * 40, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playClear() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }
}

class MalayalamApp {
    constructor() {
        this.sound = new SoundFX();
        this.currentCategory = 'vowels';
        this.filteredList = [];
        this.currentIndex = 0;
        this.showUnderlay = false;

        // Canvas State
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.drawnPointsCount = 0;
    }

    init() {
        this.canvas = document.getElementById('drawing-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupCanvasEvents();
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }

        this.filterCategory('vowels');
        this.renderLibraryGrid();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        if (this.ctx) {
            this.ctx.scale(dpr, dpr);
        }
        this.clearCanvas();
    }

    setupCanvasEvents() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDrawing = (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const pos = getPos(e);

            const isDark = document.documentElement.classList.contains('dark');
            this.ctx.strokeStyle = isDark ? '#4ade80' : '#16a34a';
            this.ctx.lineWidth = 16;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.drawnPointsCount++;

            const prompt = document.getElementById('canvas-prompt');
            if (prompt) prompt.classList.add('opacity-0');
            this.sound.playStroke();
        };

        const draw = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
            this.drawnPointsCount++;

            if (this.drawnPointsCount % 8 === 0) {
                this.sound.playStroke();
            }
        };

        const stopDrawing = (e) => {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.ctx.closePath();
            }
        };

        // Pointer / Mouse / Touch
        this.canvas.addEventListener('pointerdown', startDrawing);
        this.canvas.addEventListener('pointermove', draw);
        this.canvas.addEventListener('pointerup', stopDrawing);
        this.canvas.addEventListener('pointerleave', stopDrawing);
    }

    clearCanvas() {
        if (!this.ctx || !this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        this.drawnPointsCount = 0;

        const prompt = document.getElementById('canvas-prompt');
        if (prompt) prompt.classList.remove('opacity-0');
    }

    toggleUnderlay() {
        this.showUnderlay = !this.showUnderlay;
        const underlayEl = document.getElementById('canvas-underlay');
        const btn = document.getElementById('btn-toggle-underlay');

        if (underlayEl && btn) {
            underlayEl.classList.toggle('hidden', !this.showUnderlay);
            btn.classList.toggle('active', this.showUnderlay);
            if (this.showUnderlay) {
                btn.classList.remove('border-indigo-200', 'dark:border-indigo-800');
                btn.classList.add('border-indigo-700');
            } else {
                btn.classList.add('border-indigo-200', 'dark:border-indigo-800');
                btn.classList.remove('border-indigo-700');
            }
        }
    }

    selectCategory(cat) {
        this.filterCategory(cat);
    }

    filterCategory(cat) {
        this.currentCategory = cat;
        if (typeof MALAYALAM_CURRICULUM !== 'undefined') {
            this.filteredList = MALAYALAM_CURRICULUM.filter(item => {
                if (cat === 'vowels') return item.type === 'vowel';
                if (cat === 'consonants') return item.type === 'consonant';
                if (cat === 'chillus') return item.type === 'chillu';
                return true;
            });
        }
        this.currentIndex = 0;
        this.renderCurrentCard();
    }

    getCurrentItem() {
        if (this.filteredList.length > 0) {
            return this.filteredList[this.currentIndex];
        }
        return (typeof MALAYALAM_CURRICULUM !== 'undefined') ? MALAYALAM_CURRICULUM[0] : null;
    }

    renderCurrentCard() {
        const item = this.getCurrentItem();
        if (!item) return;

        const charEl = document.getElementById('card-malayalam-char');
        const romanEl = document.getElementById('card-roman-sound');
        const typeEl = document.getElementById('card-type-badge');
        const wordEl = document.getElementById('card-example-malayalam');
        const translitEl = document.getElementById('card-example-translit');
        const meaningEl = document.getElementById('card-example-meaning');
        const underlayCharEl = document.getElementById('underlay-char');
        const progressTextEl = document.getElementById('curriculum-progress-text');
        const progressBarEl = document.getElementById('curriculum-progress-bar');
        const indexIndicatorEl = document.getElementById('letter-index-indicator');

        if (charEl) charEl.textContent = item.char;
        if (romanEl) romanEl.textContent = `"${item.roman}"`;
        if (typeEl) typeEl.textContent = item.type;
        if (wordEl) wordEl.textContent = item.word;
        if (translitEl) translitEl.textContent = `(${item.translit})`;
        if (meaningEl) meaningEl.textContent = item.meaning;
        if (underlayCharEl) underlayCharEl.textContent = item.char;

        // Progress Bar & Counter Update
        const total = this.filteredList.length || 1;
        if (progressTextEl) progressTextEl.textContent = `${this.currentIndex + 1} / ${total}`;
        if (progressBarEl) {
            const pct = ((this.currentIndex + 1) / total) * 100;
            progressBarEl.style.width = `${pct}%`;
        }
        if (indexIndicatorEl) indexIndicatorEl.textContent = `${this.currentIndex + 1} of ${total}`;

        this.clearCanvas();
    }

    nextLetter() {
        this.clearCanvas();

        if (this.filteredList.length > 0) {
            if (this.currentIndex < this.filteredList.length - 1) {
                this.currentIndex++;
            } else {
                this.currentIndex = 0; // Loop back
            }
        }

        this.renderCurrentCard();
    }

    prevLetter() {
        this.clearCanvas();

        if (this.filteredList.length > 0) {
            if (this.currentIndex > 0) {
                this.currentIndex--;
            } else {
                this.currentIndex = this.filteredList.length - 1; // Loop to end
            }
        }

        this.renderCurrentCard();
    }

    playAudio() {
        const item = this.getCurrentItem();
        if (!item) return;

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(item.char);
            utterance.lang = 'ml-IN';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        } else {
            alert(`Pronunciation sound: "${item.roman}" as in ${item.word}`);
        }
    }

    renderLibraryGrid(typeFilter = 'all') {
        const grid = document.getElementById('library-grid');
        if (!grid || typeof MALAYALAM_CURRICULUM === 'undefined') return;

        grid.innerHTML = '';

        const filtered = MALAYALAM_CURRICULUM.filter(item => {
            if (typeFilter === 'all') return true;
            return item.type === typeFilter;
        });

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-grid-card border-2 border-slate-200 dark:border-slate-700 hover:border-duo-green rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition transform hover:-translate-y-1 shadow-sm group";
            card.onclick = () => {
                this.currentCategory = item.type === 'vowel' ? 'vowels' : item.type === 'consonant' ? 'consonants' : 'chillus';
                const catSelect = document.getElementById('category-select');
                if (catSelect) catSelect.value = this.currentCategory;

                this.filterCategory(this.currentCategory);
                this.currentIndex = this.filteredList.findIndex(i => i.id === item.id);
                if (this.currentIndex === -1) this.currentIndex = 0;

                this.renderCurrentCard();
                this.navigateTo('practice');
            };

            card.innerHTML = `
                <span class="font-malayalam text-5xl font-bold text-body group-hover:scale-110 transition mb-2">${item.char}</span>
                <span class="text-sm font-extrabold text-accent-blue">"${item.roman}"</span>
                <span class="text-xs text-muted font-semibold mt-1">${item.word}</span>
            `;
            grid.appendChild(card);
        });
    }

    filterLibrary(type, event) {
        document.querySelectorAll('.lib-filter-btn').forEach(btn => {
            btn.className = "lib-filter-btn px-4 py-2 rounded-xl bg-filter-inactive text-filter-inactive font-extrabold text-sm transition";
        });
        if (event && event.target) {
            event.target.className = "lib-filter-btn px-4 py-2 rounded-xl bg-filter-active text-filter-active font-extrabold text-sm shadow";
        }
        this.renderLibraryGrid(type);
    }

    navigateTo(view) {
        ['practice', 'library'].forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (el) el.classList.add('hidden');
            const tabBtn = document.getElementById(`tab-${v}`);
            if (tabBtn) tabBtn.className = "py-3 px-5 border-b-4 border-transparent text-tab-inactive font-extrabold flex items-center space-x-2 transition";
        });

        const activeView = document.getElementById(`view-${view}`);
        if (activeView) activeView.classList.remove('hidden');

        const activeTab = document.getElementById(`tab-${view}`);
        if (activeTab) activeTab.className = "py-3 px-5 border-b-4 border-duo-green text-accent-green font-extrabold flex items-center space-x-2 transition";

        if (view === 'practice') {
            setTimeout(() => this.resizeCanvas(), 50);
        }
    }

    toggleTheme() {
        document.documentElement.classList.toggle('dark');
    }
}

// Global Initialization
let app;
window.onload = () => {
    app = new MalayalamApp();
    app.init();
};