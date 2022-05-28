/**
 * @class
 * @name SiftTracking
 * @constructor
 * @param {*} userId
 * @param {string} feid
 * @param {string} [network='default']
 *
 * @property {boolean} isInitialized
 * @property {boolean} snippetLoaded
 * @property {Object} config
 * @property {Object} eventData
 */
class SiftTracking {
    constructor(userId = null, feid = '', network = 'default') {
        this.config = {
            userId: userId ? `${network}:${userId}` : null,
            feid: feid,
            snippetKey: 'SNIPPET_KEY',
            snippetSrc: 'https://cdn.sift.com/s.js',
            apiKey: 'API_KEY',
            apiUrl: 'https://api.sift.com/v205/events'
        };
        this.eventData = {};
        this.isInitialized = false;
        this.snippetLoaded = false;
        this._init();
        return this;
    }

    /**
     * Initialize tracking
     * @method
     * @name _init
     * @private
     */
    _init() {
        const {userId, feid, apiKey} = this.config;
        this.eventData = {
            "$api_key": apiKey,
            "$user_id": userId,
            "$session_id": feid,
            "$browser": {
                "$user_agent"       : navigator.userAgent,
                "$accept_language"  : navigator.languages.join(),
                "$content_language" : navigator.language
            }
        };
        this.isInitialized = true;

        this._loadSnippet()
            .then(message => {
                this.snippetLoaded = true;
                console.log(message);
            })
            .catch(error => {
                this._handleError(error, 'loadSnippet');
            });
    }

    /**
     * Load js snippet
     * @method
     * @name _loadSnippet
     * @private
     * @returns {Promise<SiftTracking>}
     * @throws Error
     */
    _loadSnippet() {
        return new Promise((resolve, reject) => {
            const {userId, feid, snippetKey, snippetSrc} = this.config;
            if (!feid || !snippetKey || !snippetSrc) {
                throw new Error('invalid config');
            }

            const _sift = window._sift = window._sift || [];
            _sift.push(['_setAccount', snippetKey]);
            _sift.push(['_setUserId', userId]);
            _sift.push(['_setSessionId', feid]);
            _sift.push(['_trackPageview']);

            const snippetScript = document.createElement('script');
            snippetScript.onload = () => {
                resolve('SiftTracking::loadSnippet:Success')
            };
            snippetScript.onerror = (error) => {
                reject('script fetching failed');
            };
            snippetScript.async = true;
            snippetScript.type = 'text/javascript';
            snippetScript.src = snippetSrc;
            document.head.appendChild(snippetScript);
        });
    }

    /**
     * Send event proxy
     * @method
     * @name sendEvent
     * @param {string} type
     * @param {Object} [data={}]
     * @public
     */
    sendEvent(type, data = {}) {
        try {
            this._apiSendEvent(type, data)
        } catch(e) {
            this._handleError(e, 'sendEvent');
        }
    }

    /**
     * API send event
     * @method
     * @name _apiSendEvent
     * @param {string} type
     * @param {Object} data
     * @private
     * @throws Error
     */
    _apiSendEvent(type, data) {
        if (!this.isInitialized) {
            throw new Error('instance is not initialized');
        }
        if (!type) {
            throw new Error('invalid event type');
        }
        if (Object.prototype.toString.call(data) !== '[object Object]') {
            throw new Error('invalid custom data');
        }

        const {apiKey, apiUrl} = this.config;
        if (!apiKey || !apiUrl) {
            throw new Error('invalid API config');
        }

        const eventData = {
            "$type": type,
            ...this.eventData,
            ...data,
        };

        this._apiPostData(apiUrl, eventData)
            .then(response => {
                if (response.ok) {
                    console.log(`SiftTracking::sendEvent:Success: ${type}`);
                } else {
                    throw new Error(`${type} ${response.error_message || 'invalid response'}`);
                }
            })
            .catch((error) => {
                this._handleError(error, 'sendEvent');
            });
    }

    /**
     * API post data
     * @method
     * @name _apiPostData
     * @param {string} url
     * @param {Object} data
     * @returns {Promise<Object>}
     * @throws Error
     * @private
     */
    async _apiPostData(url = '', data = {}) {
        return await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(data)
        });
    }

    /**
     * Handle error
     * @method
     * @name _handleError
     * @param {*} error
     * @param {string} [method]
     * @private
     */
    _handleError(error, method) {
        const errorMessage = `SiftTracking::${method || 'General'}:Error: ${error.message || error || 'UNKNOWN'}`;
        console.error(errorMessage);
    }
}

const siftTracking = window['siftTracking'] = new SiftTracking('userId', 'gl.getFEID()', 'network_name');
siftTracking.sendEvent('$create_account', {custom: 'var_value'});
