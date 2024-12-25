class SnowEffect {
    constructor() {
        this.createSnowflakes();
        this.startSnowfall();
    }

    createSnowflakes() {
        const colors = ['#fff', '#f3f3f3', '#ececec'];
        setInterval(() => {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.style.left = Math.random() * 100 + 'vw';
            snowflake.style.opacity = Math.random();
            snowflake.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            document.querySelector('.snowfall').appendChild(snowflake);
            
            setTimeout(() => {
                snowflake.remove();
            }, 10000);
        }, 100);
    }

    startSnowfall() {
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;

        const snowfall = () => {
            const timeLeft = animationEnd - Date.now();
            
            if (timeLeft <= 0) {
                return;
            }
            
            confetti({
                particleCount: 1,
                startVelocity: 0,
                ticks: 200,
                origin: {
                    x: Math.random(),
                    y: 0
                },
                colors: ['#ffffff'],
                shapes: ['circle'],
                gravity: 0.3,
                scalar: 0.5,
                drift: 0
            });
            
            requestAnimationFrame(snowfall);
        };

        snowfall();
    }
}

// 初始化雪花效果
document.addEventListener('DOMContentLoaded', () => {
    new SnowEffect();
}); 