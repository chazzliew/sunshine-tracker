class SunshineTracker {
    constructor() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // 显示当前用户名
        document.getElementById('currentUserDisplay').textContent = `欢迎，${currentUser}`;
        
        // 添加退出登录功能
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
        
        this.records = JSON.parse(localStorage.getItem(`sunshineRecords_${currentUser}`)) || [];
        this.currentDate = new Date();
        this.statsChart = null;
        
        this.initializeElements();
        this.bindEvents();
        this.setupChart();
        this.updateStats('week');
        this.renderCalendar();
        this.initializeDateTimeDisplay();
    }

    initializeElements() {
        this.startTimeInput = document.getElementById('startTime');
        this.endTimeInput = document.getElementById('endTime');
        this.durationHint = document.getElementById('durationHint');
        this.checkInBtn = document.getElementById('checkInBtn');
        this.confirmDialog = document.getElementById('confirmDialog');
        this.confirmReplaceBtn = document.getElementById('confirmReplace');
        this.cancelReplaceBtn = document.getElementById('cancelReplace');
    }

    initializeDateTimeDisplay() {
        const updateDateTime = () => {
            const now = new Date();
            
            // 更新日期显示
            const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            const dateDisplay = now.toLocaleDateString('zh-CN', dateOptions);
            document.querySelector('.current-date').textContent = dateDisplay;
            
            // 更新时间显示
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            const timeDisplay = now.toLocaleTimeString('zh-CN', timeOptions);
            document.querySelector('.current-time').textContent = `北京时间 ${timeDisplay}`;
        };

        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    bindEvents() {
        this.startTimeInput.addEventListener('change', () => this.updateDurationHint());
        this.endTimeInput.addEventListener('change', () => this.updateDurationHint());
        this.checkInBtn.addEventListener('click', () => this.checkIn());

        // 统计周期切换
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.period-btn.active').classList.remove('active');
                e.target.classList.add('active');
                this.updateStats(e.target.dataset.period);
            });
        });

        // 日历导航
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // 对话框事件
        this.confirmDialog.addEventListener('click', (e) => {
            if (e.target === this.confirmDialog) {
                this.hideDialog();
            }
        });

        this.confirmReplaceBtn.addEventListener('click', () => {
            this.replaceExistingRecord();
            this.hideDialog();
        });

        this.cancelReplaceBtn.addEventListener('click', () => {
            this.hideDialog();
        });
    }

    updateDurationHint() {
        if (this.startTimeInput.value && this.endTimeInput.value) {
            const duration = this.calculateDuration(
                this.startTimeInput.value,
                this.endTimeInput.value
            );
            this.durationHint.textContent = duration;
        }
    }

    calculateDuration(startTime, endTime) {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        let duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        if (duration < 0) duration += 24 * 60;
        
        return duration;
    }

    showDialog(existingRecord) {
        const recordInfo = `${existingRecord.startTime}~${existingRecord.endTime}，晒太阳${Math.round(existingRecord.duration / (60 * 1000))}分钟`;
        this.confirmDialog.querySelector('.existing-record').textContent = recordInfo;
        this.confirmDialog.style.display = 'flex';
        this.pendingRecord = {
            startTime: this.startTimeInput.value,
            endTime: this.endTimeInput.value,
            duration: this.calculateDuration(this.startTimeInput.value, this.endTimeInput.value) * 60 * 1000
        };
    }

    hideDialog() {
        this.confirmDialog.style.display = 'none';
        this.pendingRecord = null;
    }

    replaceExistingRecord() {
        const today = new Date();
        const todayStr = today.toDateString();
        
        this.records = this.records.filter(record => 
            new Date(record.date).toDateString() !== todayStr
        );

        const startTime = new Date(today);
        const [hours, minutes] = this.pendingRecord.startTime.split(':');
        startTime.setHours(hours, minutes, 0);

        this.records.push({
            date: startTime.toISOString(),
            startTime: this.pendingRecord.startTime,
            endTime: this.pendingRecord.endTime,
            duration: this.pendingRecord.duration
        });

        this.saveRecords();
        
        const activePeriod = document.querySelector('.period-btn.active').dataset.period;
        this.updateStats(activePeriod);
        this.renderCalendar();
        
        this.showSuccessFeedback('打卡已更新！☀️');
        
        this.endTimeInput.value = '';
        this.durationHint.textContent = '0';
    }

    checkIn() {
        if (!this.startTimeInput.value || !this.endTimeInput.value) {
            alert('请输入完整的时间！');
            return;
        }

        const today = new Date();
        const todayStr = today.toDateString();
        const existingRecord = this.records.find(record => 
            new Date(record.date).toDateString() === todayStr
        );

        if (existingRecord) {
            this.showDialog(existingRecord);
            return;
        }

        const duration = this.calculateDuration(
            this.startTimeInput.value,
            this.endTimeInput.value
        );

        const [hours, minutes] = this.startTimeInput.value.split(':');
        const startTime = new Date(today);
        startTime.setHours(hours, minutes, 0);

        this.records.push({
            date: startTime.toISOString(),
            startTime: this.startTimeInput.value,
            endTime: this.endTimeInput.value,
            duration: duration * 60 * 1000
        });

        this.saveRecords();
        
        const activePeriod = document.querySelector('.period-btn.active').dataset.period;
        this.updateStats(activePeriod);
        this.renderCalendar();
        
        this.showSuccessFeedback('打卡成功！☀️');
        
        this.endTimeInput.value = '';
        this.durationHint.textContent = '0';
    }

    showSuccessFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'success-feedback';
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    setupChart() {
        const ctx = document.getElementById('statsChart').getContext('2d');
        if (this.statsChart) {
            this.statsChart.destroy();
        }
        
        // 定义渐变色
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(255, 140, 0, 0.8)');    // 明亮的橙色
        gradient.addColorStop(1, 'rgba(255, 183, 77, 0.2)');   // 淡橙色

        this.statsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '晒太阳时长（分钟）',
                    data: [],
                    backgroundColor: gradient,
                    borderRadius: 8,
                    borderSkipped: false,  // 使柱状图两端都是圆角
                    barThickness: 'flex',  // 自适应宽度
                    maxBarThickness: 35,   // 最大宽度限制
                    hoverBackgroundColor: 'rgba(255, 140, 0, 0.9)',
                    hoverBorderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            padding: 8,
                            color: '#666'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#666'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 15,
                            color: '#666',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleFont: {
                            size: 13
                        },
                        bodyFont: {
                            size: 12
                        },
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: false
                    }
                }
            }
        });
    }

    updateStats(period) {
        let startDate = new Date();
        let labels = [];
        let data = [];

        switch(period) {
            case 'week':
                startDate.setDate(startDate.getDate() - 6);
                for (let i = 0; i < 7; i++) {
                    const date = new Date(startDate);
                    date.setDate(date.getDate() + i);
                    labels.push(date.toLocaleDateString('zh-CN', { weekday: 'short' }));
                    
                    const dayRecords = this.records.filter(record => 
                        new Date(record.date).toDateString() === date.toDateString()
                    );
                    const totalMinutes = dayRecords.reduce((sum, record) => 
                        sum + record.duration / (60 * 1000), 0
                    );
                    data.push(totalMinutes);
                }
                break;

            case 'month':
                startDate.setDate(1);
                const daysInMonth = new Date(
                    startDate.getFullYear(),
                    startDate.getMonth() + 1,
                    0
                ).getDate();

                for (let i = 1; i <= daysInMonth; i++) {
                    labels.push(i + '日');
                    const date = new Date(startDate.getFullYear(), startDate.getMonth(), i);
                    const dayRecords = this.records.filter(record =>
                        new Date(record.date).toDateString() === date.toDateString()
                    );
                    const totalMinutes = dayRecords.reduce((sum, record) =>
                        sum + record.duration / (60 * 1000), 0
                    );
                    data.push(totalMinutes);
                }
                break;

            case 'year':
                const months = ['1月', '2月', '3月', '4月', '5月', '6月',
                              '7月', '8月', '9月', '10月', '11月', '12月'];
                for (let i = 0; i < 12; i++) {
                    labels.push(months[i]);
                    const monthRecords = this.records.filter(record => {
                        const date = new Date(record.date);
                        return date.getMonth() === i &&
                               date.getFullYear() === startDate.getFullYear();
                    });
                    const totalMinutes = monthRecords.reduce((sum, record) =>
                        sum + record.duration / (60 * 1000), 0
                    );
                    data.push(totalMinutes);
                }
                break;
        }

        this.statsChart.data.labels = labels;
        this.statsChart.data.datasets[0].data = data;
        this.statsChart.update();

        const totalMinutes = data.reduce((sum, val) => sum + val, 0);
        const nonZeroDays = data.filter(val => val > 0).length;
        const averageMinutes = nonZeroDays ? totalMinutes / nonZeroDays : 0;

        document.getElementById('totalDuration').textContent = 
            `${Math.round(totalMinutes)}分钟`;
        document.getElementById('averageDuration').textContent = 
            `${Math.round(averageMinutes)}分钟`;
        document.getElementById('checkInCount').textContent = 
            `${nonZeroDays}次`;
    }

    renderCalendar() {
        const displayDate = new Date(this.currentDate);
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        
        document.getElementById('currentMonth').textContent = 
            `${year}年${month + 1}月`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        for (let i = startingDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = new Date(year, month, -i).getDate();
            calendarDays.appendChild(dayDiv);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = i;

            const currentDate = new Date(year, month, i);
            const dayRecords = this.records.filter(record => 
                new Date(record.date).toDateString() === currentDate.toDateString()
            );

            if (dayRecords.length > 0) {
                dayDiv.classList.add('checked');
                
                const tooltip = document.createElement('div');
                tooltip.className = 'calendar-tooltip';
                
                const recordsInfo = dayRecords.map(record => {
                    const duration = Math.round(record.duration / (60 * 1000));
                    return `${record.startTime}~${record.endTime}，晒太阳${duration}分钟`;
                }).join('<br>');
                
                tooltip.innerHTML = `${month + 1}月${i}日<br>${recordsInfo}`;
                dayDiv.appendChild(tooltip);
            }

            calendarDays.appendChild(dayDiv);
        }

        const remainingDays = 42 - (startingDay + daysInMonth);
        for (let i = 1; i <= remainingDays; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = i;
            calendarDays.appendChild(dayDiv);
        }
    }

    saveRecords() {
        const currentUser = localStorage.getItem('currentUser');
        localStorage.setItem(`sunshineRecords_${currentUser}`, JSON.stringify(this.records));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SunshineTracker();
}); 