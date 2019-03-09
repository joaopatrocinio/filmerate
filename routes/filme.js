const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router= express.Router();

router.get('/', function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) return res.status(500).send({
            status: 500,
            response: 'Database error. Please try again.'
        });
        connection.query('SELECT filme_id, filme_title, filme_poster FROM filme', function (error, results, fields) {
            if (!results[0]) {
                return res.status(404).send({
                    status: 404,
                    response: 'Movie not found.'
                });
            }

            return res.status(200).send({
                status: 200,
                response: results
            });

        });
        connection.release();
    });
})

router.get('/:filme_id', function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) return res.status(500).send({
            status: 500,
            response: 'Database error. Please try again.'
        });
        connection.query('SELECT filme.*, realizador.realizador_nome FROM filme LEFT JOIN realizador ON filme.filme_realizador_id = realizador.realizador_id WHERE filme_id = ?', [req.params.filme_id], function (error, results, fields) {
            if (!results[0]) {
                return res.status(404).send({
                    status: 404,
                    response: 'Movie not found.'
                });
            }

            return res.status(200).send({
                status: 200,
                response: results[0]
            });

        });
        connection.release();
    });
})

router.get('/atores/:filme_id', function (req, res) {
    pool.getConnection(function (err, connection) {
        if (err) return res.status(500).send({
            status: 500,
            response: 'Database error. Please try again.'
        });
        connection.query('SELECT filme_id, ator_id, ator_nome FROM filme LEFT JOIN filme_ator ON filme_ator.filme_ator_filme_id = filme.filme_id LEFT JOIN ator ON ator.ator_id = filme_ator.filme_ator_ator_id WHERE filme.filme_id = ?', [req.params.filme_id], function (error, results, fields) {
            if (!results[0]) {
                return res.status(404).send({
                    status: 404,
                    response: 'Movie not found.'
                });
            }

            return res.status(200).send({
                status: 200,
                response: results
            });

        });
        connection.release();
    });
})

module.exports = router;
