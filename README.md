# SiftTracking
Simple javascript wrapper of sift anti-fraud library [snippet](https://sift.com/developers/docs/curl/javascript-api/overview)

## Usage
`const siftTracking = window['siftTracking'] = new SiftTracking('userId', 'FEID', 'network_name');
siftTracking.sendEvent('$create_account', {custom: 'var_value'});`
