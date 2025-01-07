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
        this.selectedDate = null;
        
        this.initializeElements();
        this.bindEvents();
        this.setupChart();
        
        // 确保先渲染日历
        this.renderCalendar();
        
        // 初始化时立即更新统计数据
        this.updateStats('7days');  // 默认显示近7天数据
        
        this.initializeDateTimeDisplay();
        this.initializeMakeupDialog();
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
            // 更新月度数据
            if (document.querySelector('.period-btn.active').dataset.period === 'month') {
                this.updateStats('month');
            }
        });
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
            // 更新月度数据
            if (document.querySelector('.period-btn.active').dataset.period === 'month') {
                this.updateStats('month');
            }
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
        const now = new Date();
        let startDate;
        let records;
        
        switch (period) {
            case '7days':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 6); // 包括今天在内的7天
                records = this.records.filter(record => 
                    new Date(record.date) >= startDate && 
                    new Date(record.date) <= now
                );
                this.updateChart(records, '近7天打卡时长', 7);
                break;
                
            case '30days':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 29); // 包括今天在内的30天
                records = this.records.filter(record => 
                    new Date(record.date) >= startDate && 
                    new Date(record.date) <= now
                );
                this.updateChart(records, '近30天打卡时长', 30);
                break;
                
            case 'month':
                // 获取当前选中的月份（默认当月）
                const selectedMonth = this.currentDate.getMonth();
                const selectedYear = this.currentDate.getFullYear();
                records = this.records.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate.getMonth() === selectedMonth && 
                           recordDate.getFullYear() === selectedYear;
                });
                const monthName = `${selectedYear}年${selectedMonth + 1}月`;
                this.updateChart(records, `${monthName}打卡时长`, 
                    new Date(selectedYear, selectedMonth + 1, 0).getDate()); // 当月天数
                break;
        }

        // 更新统计数据
        const totalMinutes = Math.round(records.reduce((sum, record) => sum + record.duration, 0) / (60 * 1000));
        const averageMinutes = records.length ? Math.round(totalMinutes / records.length) : 0;

        document.getElementById('totalDuration').textContent = `${totalMinutes}分钟`;
        document.getElementById('averageDuration').textContent = `${averageMinutes}分钟`;
        document.getElementById('checkInCount').textContent = `${records.length}次`;
    }

    updateChart(records, title, days) {
        const labels = [];
        const data = new Array(days).fill(0);
        
        // 生成日期标签
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
        }
        
        // 填充数据
        records.forEach(record => {
            const recordDate = new Date(record.date);
            const dayIndex = days - 1 - Math.floor((new Date() - recordDate) / (24 * 60 * 60 * 1000));
            if (dayIndex >= 0 && dayIndex < days) {
                data[dayIndex] += record.duration / (60 * 1000); // 转换为分钟
            }
        });

        // 更新图表
        if (this.statsChart) {
            this.statsChart.destroy();
        }

        const ctx = document.getElementById('statsChart').getContext('2d');
        this.statsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '打卡时长（分钟）',
                    data: data,
                    backgroundColor: 'rgba(255, 140, 0, 0.5)',
                    borderColor: 'rgba(255, 140, 0, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => `${Math.round(value)}分钟`
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: title
                    }
                }
            }
        });
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

            // 添加点击事件
            dayDiv.addEventListener('click', () => {
                if (dayRecords.length > 0) {
                    // 显示已有记录
                    const recordsInfo = dayRecords.map(record => 
                        `${record.startTime}~${record.endTime}，晒太阳${Math.round(record.duration / (60 * 1000))}分钟`
                    ).join('\n');
                    alert(`${month + 1}月${i}日的打卡记录：\n${recordsInfo}`);
                } else {
                    // 询问是否补打卡
                    if (confirm(`${month + 1}月${i}日没有打卡记录，是否要补录？`)) {
                        this.showMakeupDialog(currentDate);
                    }
                }
            });

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

    initializeMakeupDialog() {
        this.makeupDialog = document.getElementById('makeupDialog');
        this.makeupStartTime = document.getElementById('makeupStartTime');
        this.makeupEndTime = document.getElementById('makeupEndTime');
        this.makeupDurationHint = document.getElementById('makeupDurationHint');
        
        // 监听时间输入变化
        this.makeupStartTime.addEventListener('change', () => this.updateMakeupDurationHint());
        this.makeupEndTime.addEventListener('change', () => this.updateMakeupDurationHint());
        
        // 绑定按钮事件
        document.getElementById('confirmMakeup').addEventListener('click', () => this.confirmMakeup());
        document.getElementById('cancelMakeup').addEventListener('click', () => this.hideMakeupDialog());
    }

    updateMakeupDurationHint() {
        if (this.makeupStartTime.value && this.makeupEndTime.value) {
            const duration = this.calculateDuration(
                this.makeupStartTime.value,
                this.makeupEndTime.value
            );
            this.makeupDurationHint.textContent = duration;
        }
    }

    showMakeupDialog(date) {
        this.selectedDate = date;
        this.makeupDialog.querySelector('.makeup-date').textContent = 
            `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        this.makeupDialog.style.display = 'flex';
        
        // 重置输入
        this.makeupStartTime.value = '';
        this.makeupEndTime.value = '';
        this.makeupDurationHint.textContent = '0';
    }

    hideMakeupDialog() {
        this.makeupDialog.style.display = 'none';
        this.selectedDate = null;
    }

    confirmMakeup() {
        if (!this.makeupStartTime.value || !this.makeupEndTime.value) {
            alert('请输入完整的时间！');
            return;
        }

        const duration = this.calculateDuration(
            this.makeupStartTime.value,
            this.makeupEndTime.value
        );

        const startTime = new Date(this.selectedDate);
        const [hours, minutes] = this.makeupStartTime.value.split(':');
        startTime.setHours(hours, minutes, 0);

        this.records.push({
            date: startTime.toISOString(),
            startTime: this.makeupStartTime.value,
            endTime: this.makeupEndTime.value,
            duration: duration * 60 * 1000
        });

        this.saveRecords();
        this.updateStats(document.querySelector('.period-btn.active').dataset.period);
        this.renderCalendar();
        this.showSuccessFeedback('补录成功！☀️');
        this.hideMakeupDialog();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SunshineTracker();
}); 