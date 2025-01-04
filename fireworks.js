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

        // 点击触发烟花，但排除按钮和输入框
        document.addEventListener('click', (e) => {
            // 检查点击的元素是否是按钮、输入框或其他交互元素
            const isInteractive = e.target.matches('button, input, select, .calendar-day, a, .dialog-overlay');
            
            // 检查点击的元素是否在对话框内
            const isInDialog = e.target.closest('.dialog-content');
            
            // 如果不是交互元素且不在对话框内，才触发烟花
            if (!isInteractive && !isInDialog) {
                this.createFirework(e.clientX, e.clientY);
            }
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