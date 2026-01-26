class LoopManager {
    constructor(requestHandler, config) {
        this.requestHandler = requestHandler;
        this.config = config;
        this.intervalId = null;
        this.isRunning = false;

        // Aggressive mode ayarları
        if (this.config.aggressiveMode) {
            this.optimizeForAggressiveMode();
        }
    }

    optimizeForAggressiveMode() {
        console.log('⚡ Loop manager aggressive mode için optimize ediliyor...');

        // CPU çekirdek sayısını al
        const numCPUs = require('os').cpus().length;

        // Aggressive mode için ayarları artır (daha makul değerlerle)
        const newCount = Math.min(numCPUs * 50, 500); // CPU başına maks 50, toplam maks 500
        const cluster = require('cluster');

        // Sadece master process'te log bas
        if (cluster.isMaster) {
            if (this.config.multipleCount < newCount) {
                console.log(`📈 Paralel bağlantı sayısı ${this.config.multipleCount} → ${newCount} olarak artırılıyor`);
            }
            if (this.config.waitingInterval > 1) {
                console.log(`⚡ Bekleme aralığı ${this.config.waitingInterval}ms → 1ms olarak optimize ediliyor`);
            }
        }

        this.config.multipleCount = newCount;
        this.config.waitingInterval = 1;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.sendRequests(); // İlk çağrıyı hemen yap

        // Sürekli döngü için interval başlat
        this.intervalId = setInterval(() => {
            this.sendRequests();
        }, this.config.waitingInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    sendRequests() {
        if (!this.isRunning) return;

        if (this.config.multipleRequests) {
            // Paralel istekler (await olmadan, background'da çalışır)
            this.requestHandler.sendMultipleRequests(this.config.multipleCount);
        } else {
            // Tek istek (await olmadan, background'da çalışır)
            this.requestHandler.sendSingleRequest();
        }
    }

    isActive() {
        return this.isRunning;
    }
}

module.exports = LoopManager;