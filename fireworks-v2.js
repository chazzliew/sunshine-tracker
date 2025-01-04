class FireworksEffect {
    constructor() {
        this.container = document.getElementById('fireworks-container');
        this.isMobile = window.innerWidth <= 768;
        this.setupFireworks();
    }

    setupFireworks() {
        // 移动端降低频率和粒子数量
        setInterval(() => {
            if (Math.random() < (this.isMobile ? 0.15 : 0.2)) {
                this.createFirework();
            }
        }, this.isMobile ? 6000 : 5000);
    }

    createFirework(x, y) {
        const originX = x ? x / window.innerWidth : Math.random();
        const originY = y ? y / window.innerHeight : 0.2; // 在移动端更靠上

        confetti({
            particleCount: this.isMobile ? 50 : 80, // 移动端减少粒子数
            spread: this.isMobile ? 45 : 60,
            origin: { x: originX, y: originY },
            colors: ['#e60012', '#ffd700', '#ff6b6b', '#ffc107'],
            ticks: this.isMobile ? 120 : 150,
            gravity: 1,
            scalar: this.isMobile ? 0.8 : 1, // 移动端缩小粒子
            shapes: ['circle'],
            zIndex: 1,
            disableForReducedMotion: true,
            resize: true,
            useWorker: true,
            appendTo: this.container
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FireworksEffect();
}); 