const config = require('config');

const configuration = config.util.toObject(config);

console.log(JSON.stringify(configuration));

console.log('NODE_APP_INSTANCE', config.util.getEnv('NODE_APP_INSTANCE'));
