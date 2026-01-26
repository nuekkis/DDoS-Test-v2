const https = require('https');
const http = require('http');
const Statistics = require('./stats');
const Logger = require('./logger');

class RequestHandler {
    constructor(config) {
        this.config = config;
        this.targetUrl = null;
        this.parsedUrl = null;
        this.workerId = this.config.aggressiveMode ? (parseInt(process.env.WORKER_ID || '0') || 0) : 0;
        this.stats = new Statistics();
        this.agent = null; // HTTP agent for connection pooling
    }

    setTargetUrl(urlString) {
        // URL'ye https:// eklenmemişse ekle
        this.targetUrl = urlString;
        if (!this.targetUrl.startsWith('http://') && !this.targetUrl.startsWith('https://')) {
            this.targetUrl = 'https://' + this.targetUrl;
        }

        // URL'yi parse et
        try {
            this.parsedUrl = new URL(this.targetUrl);
        } catch (error) {
            throw new Error(`Geçersiz URL: ${error.message}`);
        }
    }

    sendSingleRequest() {
        return new Promise((resolve) => {
            const isHttps = this.parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;

            const options = {
                hostname: this.parsedUrl.hostname,
                path: this.parsedUrl.pathname + this.parsedUrl.search,
                method: 'GET',
                timeout: this.config.timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            };

            const startTime = Date.now();

            // Load verisini hazırla (eğer load aktif ise)
            let requestBody = null;
            if (this.config.load) {
                const dataSizeInBytes = this.config.loadSize; // Direkt byte olarak kullan
                requestBody = 'x'.repeat(dataSizeInBytes);
                options.headers['Content-Length'] = Buffer.byteLength(requestBody, 'utf8');
            }

            const req = client.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    const endTime = Date.now();
                    const duration = endTime - startTime;

                    // HTTP status kodlarına göre mesajları al
                    const statusMessages = {
                        // 1xx Informational
                        100: 'Continue',
                        101: 'Switching Protocols',
                        102: 'Processing',

                        // 2xx Successful
                        200: 'Success',
                        201: 'Created',
                        202: 'Accepted',
                        203: 'Non-Authoritative Information',
                        204: 'No Content',
                        205: 'Reset Content',
                        206: 'Partial Content',

                        // 3xx Redirection
                        300: 'Multiple Choices',
                        301: 'Moved Permanently',
                        302: 'Found',
                        303: 'See Other',
                        304: 'Not Modified',
                        305: 'Use Proxy',
                        307: 'Temporary Redirect',
                        308: 'Permanent Redirect',

                        // 4xx Client Error
                        400: 'Bad Request',
                        401: 'Unauthorized',
                        402: 'Payment Required',
                        403: 'Forbidden',
                        404: 'Not Found',
                        405: 'Method Not Allowed',
                        406: 'Not Acceptable',
                        407: 'Proxy Authentication Required',
                        408: 'Request Timeout',
                        409: 'Conflict',
                        410: 'Gone',
                        411: 'Length Required',
                        412: 'Precondition Failed',
                        413: 'Payload Too Large',
                        414: 'URI Too Long',
                        415: 'Unsupported Media Type',
                        416: 'Range Not Satisfiable',
                        417: 'Expectation Failed',
                        418: 'I\'m a teapot',
                        422: 'Unprocessable Entity',
                        423: 'Locked',
                        424: 'Failed Dependency',
                        425: 'Too Early',
                        426: 'Upgrade Required',
                        428: 'Precondition Required',
                        429: 'Too Many Requests',
                        431: 'Request Header Fields Too Large',
                        451: 'Unavailable For Legal Reasons',

                        // 5xx Server Error
                        500: 'Internal Server Error',
                        501: 'Not Implemented',
                        502: 'Bad Gateway',
                        503: 'Service Unavailable',
                        504: 'Gateway Timeout',
                        505: 'HTTP Version Not Supported',
                        506: 'Variant Also Negotiates',
                        507: 'Insufficient Storage',
                        508: 'Loop Detected',
                        510: 'Not Extended',
                        511: 'Network Authentication Required'
                    };

                    const isError = res.statusCode >= 400;
                    const emoji = isError ? '❌' : '✅';

                    let statusDisplay;
                    if (statusMessages[res.statusCode]) {
                        statusDisplay = `[${res.statusCode}]: ${statusMessages[res.statusCode]}`;
                    } else {
                        statusDisplay = isError ? `[${res.statusCode}]: Unknown Error` : `[${res.statusCode}]`;
                    }

                    this.localCounter++;
                    Logger.logRequest(0, statusDisplay, duration); // Global counter Logger'da

                    // İstatistikleri güncelle
                    const dataSize = this.config.load ? this.config.loadSize : 0;
                    this.stats.recordRequest(!isError, duration, dataSize);

                    resolve({
                        statusCode: res.statusCode,
                        duration,
                        size: data.length,
                        success: !isError
                    });
                });
            });

            req.on('timeout', () => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                this.localCounter++;
                Logger.logRequest(0, '[TIMEOUT]', duration); // Global counter Logger'da

                // İstatistikleri güncelle
                this.stats.recordRequest(false, duration);

                req.destroy();
                resolve({
                    statusCode: 'TIMEOUT',
                    duration,
                    size: 0,
                    success: false
                });
            });

            req.on('error', (error) => {
                const endTime = Date.now();
                const duration = endTime - startTime;
                this.localCounter++;
                Logger.logRequest(0, `[ERROR] - ${error.message}`, duration); // Global counter Logger'da

                // İstatistikleri güncelle
                this.stats.recordRequest(false, duration);

                resolve({
                    statusCode: 'ERROR',
                    duration,
                    error: error.message,
                    success: false
                });
            });

            // Load verisini gönder (eğer varsa)
            if (requestBody) {
                req.write(requestBody);
            }

            req.end();
        });
    }

    async sendMultipleRequests(count) {
        const promises = [];
        for (let i = 0; i < count; i++) {
            promises.push(this.sendSingleRequest());
        }
        return await Promise.all(promises);
    }

    setAgent(agent) {
        this.agent = agent;
    }


    getTargetUrl() {
        return this.targetUrl;
    }

    getStats() {
        return this.stats;
    }
}

module.exports = RequestHandler;