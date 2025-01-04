class FireworksEffect {
    constructor() {
        this.setupFireworks();
    }

    setupFireworks() {
        // 随机触发烟花
        setInterval(() => {
            if (Math.random() < 0.3) { // 30%概率触发
                this.createFirework();
            }
        }, 3000);

        // 点击触发烟花
        document.addEventListener('click', (e) => {
            this.createFirework(e.clientX, e.clientY);
        });
    }

    createFirework(x, y) {
        // 如果没有指定位置，随机生成
        const originX = x ? x / window.innerWidth : Math.random();
        const originY = y ? y / window.innerHeight : Math.random();

        // 创建烟花效果
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: originX, y: originY },
            colors: ['#e60012', '#ffd700', '#ff6b6b', '#ffc107'],
            ticks: 200,
            gravity: 0.8,
            scalar: 1.2,
            shapes: ['circle', 'square'],
            zIndex: 100
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FireworksEffect();
}); 