const Config = require('./settings');
const RequestHandler = require('./request');
const Logger = require('./logger');
const cluster = require('cluster');
const http = require('http');

class App {
    constructor() {
        this.config = null;
        this.requestHandler = null;
        this.aggressiveAgent = null;
        this.workers = [];
    }

    async initialize(urlArg) {
        try {
            // Komut satırından URL'yi doğrula
            if (!urlArg) {
                Logger.logUsage();
                process.exit(1);
            }

            // Config'i yükle
            this.config = new Config();

            // Request handler'ı oluştur
            this.requestHandler = new RequestHandler(this.config);

            // URL'yi ayarla
            this.requestHandler.setTargetUrl(urlArg);

            // Aggressive mode aktif ise optimizasyonları başlat
            if (this.config.aggressiveMode) {
                this.initializeAggressiveMode(urlArg);
            }

            // Sadece master process'te konfigürasyonu logla (cluster spam'ini önle)
            const cluster = require('cluster');
            if (!this.config.aggressiveMode || cluster.isMaster) {
                Logger.logConfig({
                    targetUrl: this.requestHandler.getTargetUrl(),
                    displayConfig: () => this.config.displayConfig()
                });
            }

            return true;
        } catch (error) {
            Logger.logError(error.message);
            process.exit(1);
        }
    }

    getRequestHandler() {
        return this.requestHandler;
    }

    getConfig() {
        return this.config;
    }

    initializeAggressiveMode(urlArg) {
        const cluster = require('cluster');

        if (cluster.isMaster) {
            console.log('🔥 Aggressive Mode aktif! Sistem optimizasyonları başlatılıyor...');
        }

        // Connection pooling agent oluştur
        this.aggressiveAgent = new http.Agent({
            keepAlive: true,
            maxSockets: 500,            // Daha makul değer
            maxFreeSockets: 100,        // Önbellekte tutulan bağlantı
            timeout: this.config.timeout,
            keepAliveMsecs: 1000,       // Keep-alive aralığı
            scheduling: 'fifo'          // First-in-first-out
        });

        // CPU çekirdek sayısı kadar worker başlat (cluster mode)
        if (cluster.isMaster) {
            const numCPUs = require('os').cpus().length;
            console.log(`🚀 ${numCPUs} CPU çekirdeği kullanılıyor...`);

            // Worker'ları başlatma işlemini buradan kaldırdım çünkü start.js'te yapılıyor
            // Sadece agent'ı ayarla
            this.requestHandler.setAgent(this.aggressiveAgent);
        } else {
            // Worker process'lerde agent kullan
            this.requestHandler.setAgent(this.aggressiveAgent);
        }
    }

    aggregateWorkerStats(workerStats) {
        // Worker'lardan gelen istatistikleri ana istatistiklere ekle
        const mainStats = this.requestHandler.getStats();
        mainStats.recordRequest(
            workerStats.success,
            workerStats.duration,
            workerStats.dataSize
        );
    }

    shutdown() {
        const cluster = require('cluster');
        // Sadece master process'te istatistikleri göster
        if (!this.config.aggressiveMode || cluster.isMaster) {
            Logger.logShutdown();
            Logger.logStats(this.requestHandler.getStats());
        }

        // Aggressive mode ise worker'ları kapat (sadece master'da)
        if (this.config && this.config.aggressiveMode && cluster.isMaster) {
            console.log('🔄 Worker process\'ler kapatılıyor...');
            for (const worker of this.workers) {
                worker.kill();
            }
        }
    }
}

module.exports = App;