class Logger {
    static globalCounter = 0; // Global sıralı counter

    static logRequest(requestId, statusDisplay, duration) {
        // Global counter'ı kullan ve artır
        this.globalCounter++;

        // HTTP status kodlarına göre emoji seç
        let emoji = '✅';
        if (statusDisplay.includes('[4') || statusDisplay.includes('[5') || statusDisplay.includes('[TIMEOUT]') || statusDisplay.includes('[ERROR]')) {
            emoji = '❌';
        }

        console.log(`${emoji} İstek Gönderildi: ${this.globalCounter}. İstek | ${statusDisplay} | ${duration}ms`);
    }

    static logConfig(config) {
        console.log(`Hedef URL: ${config.targetUrl}`);
        config.displayConfig();
        console.log('---');
    }

    static logShutdown() {
        console.log('\n🛑 Program durduruluyor...');
    }

    static logError(message) {
        console.error('Hata:', message);
    }

    static logUsage() {
        console.error('Kullanım: node start.js <url>');
        console.error('Örnek: node start.js google.com');
    }

    static logStats(stats) {
        stats.displayStats();
    }
}

module.exports = Logger;