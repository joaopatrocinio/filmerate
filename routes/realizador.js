const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router= express.Router();

router.get('/', function(req, res) {
    pool.query('SELECT * FROM realizador', function (error, results, fields) {
        if (!results[0]) {
            return res.status(404).send({
                status: 404,
                response: 'Director not found.'
            });
        }

        return res.status(200).send({
            status: 200,
            response: results
        });

    });
})

router.get('/:realizador_id', function(req, res) {
    pool.query('SELECT * FROM realizador WHERE realizador_id=?', [req.params.realizador_id], function (error, results, fields) {
        if (!results[0]) {
            return res.status(404).send({
                status: 404,
                response: 'Director not found.'
            });
        }

        return res.status(200).send({
            status: 200,
            response: results[0]
        });

    });
})

module.exports = router;
