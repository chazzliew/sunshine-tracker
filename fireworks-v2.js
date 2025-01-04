class FireworksEffect {
    constructor() {
        this.setupFireworks();
    }

    setupFireworks() {
        // 只保留随机触发烟花，但降低频率和概率
        setInterval(() => {
            if (Math.random() < 0.2) { // 降低到20%概率
                this.createFirework();
            }
        }, 5000); // 增加间隔到5秒
    }

    createFirework(x, y) {
        // 如果没有指定位置，随机生成
        const originX = x ? x / window.innerWidth : Math.random();
        const originY = y ? y / window.innerHeight : 0.3; // 固定在上部区域

        // 创建烟花效果
        confetti({
            particleCount: 80,    // 减少粒子数量
            spread: 60,
            origin: { x: originX, y: originY },
            colors: ['#e60012', '#ffd700', '#ff6b6b', '#ffc107'],
            ticks: 150,          // 减少持续时间
            gravity: 1,          // 增加重力
            scalar: 1,
            shapes: ['circle'],  // 只使用圆形
            zIndex: 1,          // 降低z-index，确保不会遮挡交互元素
            disableForReducedMotion: true // 支持减少动画
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FireworksEffect();
}); 