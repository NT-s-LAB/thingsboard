export default () => ({
  thingsBoard: {
    url: process.env.THINGSBOARD_URL || 'http://localhost:9090',
    username: process.env.THINGSBOARD_USERNAME || 'sysadmin@thingsboard.org',
    password: process.env.THINGSBOARD_PASSWORD || 'sysadmin',
    timeout: parseInt(process.env.THINGSBOARD_TIMEOUT, 10) || 30000,
    retryAttempts: parseInt(process.env.THINGSBOARD_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.THINGSBOARD_RETRY_DELAY, 10) || 1000,
  },
});