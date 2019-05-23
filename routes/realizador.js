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

router.get('/:realizador_id/filmes', function (req, res) {
    if (req.params.realizador_id) {
        pool.query('SELECT filme_id, filme_title, filme_poster FROM filme WHERE filme_realizador_id = ?', [req.params.realizador_id], function (error, results) {
            if (error) return res.status(500).send({
                status: 500,
                response: "Database error. Please try again."
            })

            return res.status(200).send({
                status: 200,
                response: results
            })
        })
    } else {
        return res.status(400).send({
            status: 400,
            response: "Please include all necessary data in the request."
        })
    }
})

module.exports = router;
