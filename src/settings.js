const fs = require('fs');
const path = require('path');

class Config {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'config.json');
        this.config = null;
        this.loadConfig();
        this.validateConfig();
    }

    loadConfig() {
        try {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            this.config = JSON.parse(configData);
        } catch (error) {
            throw new Error(`Config dosyası okunamadı: ${error.message}`);
        }
    }

    validateConfig() {
        const requiredFields = ['timeout', 'waiting_interval', 'multiple_requests'];
        const missingFields = requiredFields.filter(field => !(field in this.config));

        if (missingFields.length > 0) {
            throw new Error(`Config dosyasında eksik alanlar: ${missingFields.join(', ')}`);
        }

        // Timeout validasyonu
        if (typeof this.config.timeout !== 'number' || this.config.timeout <= 0) {
            throw new Error('timeout değeri pozitif sayı olmalıdır');
        }

        // Waiting interval validasyonu
        if (typeof this.config.waiting_interval !== 'number' || this.config.waiting_interval <= 0) {
            throw new Error('waiting_interval değeri pozitif sayı olmalıdır');
        }

        // Multiple requests validasyonu
        if (typeof this.config.multiple_requests !== 'boolean') {
            throw new Error('multiple_requests boolean değer olmalıdır');
        }

        // Multiple count validasyonu (eğer multiple_requests true ise)
        if (this.config.multiple_requests) {
            if (!('multiple_count' in this.config)) {
                throw new Error('multiple_requests true ise multiple_count alanı gerekli');
            }
            if (typeof this.config.multiple_count !== 'number' || this.config.multiple_count <= 0) {
                throw new Error('multiple_count pozitif sayı olmalıdır');
            }
        }

        // Load validasyonu
        if (typeof this.config.load !== 'boolean') {
            throw new Error('load boolean değer olmalıdır');
        }

        // Load size validasyonu (eğer load true ise)
        if (this.config.load) {
            if (!('load_size' in this.config)) {
                throw new Error('load true ise load_size alanı gerekli');
            }
            if (typeof this.config.load_size !== 'number' || this.config.load_size <= 0) {
                throw new Error('load_size pozitif sayı olmalıdır');
            }
        }

        // Aggressive mode validasyonu
        if (typeof this.config.aggressive_mode !== 'boolean') {
            throw new Error('aggressive_mode boolean değer olmalıdır');
        }
    }

    get timeout() {
        return this.config.timeout;
    }

    get waitingInterval() {
        return this.config.waiting_interval;
    }

    set waitingInterval(value) {
        this.config.waiting_interval = value;
    }

    get multipleRequests() {
        return this.config.multiple_requests;
    }

    get multipleCount() {
        return this.config.multiple_count;
    }

    set multipleCount(value) {
        this.config.multiple_count = value;
    }

    get load() {
        return this.config.load;
    }

    get loadSize() {
        return this.config.load_size;
    }

    get aggressiveMode() {
        return this.config.aggressive_mode;
    }

    get all() {
        return { ...this.config };
    }

    displayConfig() {
        console.log('Konfigürasyon:');
        console.log(`  Timeout: ${this.timeout}ms`);
        console.log(`  Bekleme aralığı: ${this.waitingInterval}ms`);
        console.log(`  Çoklu istek: ${this.multipleRequests ? 'Evet' : 'Hayır'}`);
        if (this.multipleRequests) {
            console.log(`  Çoklu istek sayısı: ${this.multipleCount}`);
        }
        console.log(`  Load: ${this.load ? 'Evet' : 'Hayır'}`);
        if (this.load) {
            console.log(`  Load boyutu: ${this.loadSize} bytes`);
        }
        console.log(`  Aggressive Mode: ${this.aggressiveMode ? 'Evet' : 'Hayır'}`);
    }
}

module.exports = Config;