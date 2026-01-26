class Statistics {
    constructor() {
        this.reset();
    }

    reset() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            totalDataSent: 0,
            startTime: Date.now()
        };
    }

    recordRequest(success, duration, dataSize = 0) {
        this.stats.totalRequests++;
        this.stats.totalResponseTime += duration;
        this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalRequests;
        this.stats.totalDataSent += dataSize;

        if (success) {
            this.stats.successfulRequests++;
        } else {
            this.stats.failedRequests++;
        }
    }

    getStats() {
        return { ...this.stats };
    }

    formatDuration(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days} gün`);
        if (hours > 0) parts.push(`${hours} saat`);
        if (minutes > 0) parts.push(`${minutes} dakika`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs} saniye`);

        return parts.join(', ');
    }

    displayStats() {
        const endTime = Date.now();
        const totalTime = (endTime - this.stats.startTime) / 1000; // saniye cinsinden

        console.log('\n📊 === İSTEK İSTATİSTİKLERİ ===');
        console.log(`⏱️  Çalışma Süresi: ${this.formatDuration(totalTime)}`);
        console.log(`📤 Toplam İstek: ${this.stats.totalRequests}`);
        console.log(`✅ Başarılı: ${this.stats.successfulRequests}`);
        console.log(`❌ Başarısız: ${this.stats.failedRequests}`);

        if (this.stats.totalRequests > 0) {
            const successRate = ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(1);
            console.log(`📊 Başarı Oranı: %${successRate}`);
            console.log(`⏳ Ortalama Yanıt Süresi: ${this.stats.averageResponseTime.toFixed(1)}ms`);
        }

        if (this.stats.totalDataSent > 0) {
            const dataInKB = (this.stats.totalDataSent / 1024).toFixed(1);
            const dataInMB = (this.stats.totalDataSent / (1024 * 1024)).toFixed(2);
            console.log(`💾 Gönderilen Veri: ${dataInKB} KB (${dataInMB} MB)`);
        }

        console.log('================================\n');
    }

    getSummary() {
        const endTime = Date.now();
        const totalTime = (endTime - this.stats.startTime) / 1000;

        return {
            duration: totalTime,
            totalRequests: this.stats.totalRequests,
            successfulRequests: this.stats.successfulRequests,
            failedRequests: this.stats.failedRequests,
            successRate: this.stats.totalRequests > 0 ? (this.stats.successfulRequests / this.stats.totalRequests) * 100 : 0,
            averageResponseTime: this.stats.averageResponseTime,
            totalDataSent: this.stats.totalDataSent
        };
    }
}

module.exports = Statistics;