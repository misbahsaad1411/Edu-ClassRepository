const app = require('./index');
const { PORT } = require('../src/config/constants');

module.exports = (req, res) => {
    app(req, res);
};
