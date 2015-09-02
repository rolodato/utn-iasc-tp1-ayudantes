var _ = require('lodash');

module.exports = {
    preguntaPorId: function (preguntas, id) {
        return _.findWhere(preguntas, {id: Number.parseInt(id) });
    },

    error: function (message) {
        return {
            error: message
        };
    }
}
