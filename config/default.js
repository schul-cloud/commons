const defer = require('config/defer').deferConfig;

module.exports = {
  firstName: undefined,
  lastName: undefined,
  fullName: defer(function fullName() {
    return `${this.firstName} ${this.lastName}`;
  }),
  foo: 'foo',
  domain: 'SC_DOMAIN',
  SHOW_VERSION: false,
  features: {
    teams: 'FEATURE_TEAMS_ENABLED',
  },
  LOGLEVEL: 'LOG_LEVEL',
};
