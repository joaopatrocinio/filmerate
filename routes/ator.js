const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router= express.Router();

router.get('/', function(req, res) {
    pool.query('SELECT * FROM ator', function (error, results, fields) {
        if (!results[0]) {
            return res.status(404).send({
                status: 404,
                response: 'Actor not found.'
            });
        }

        return res.status(200).send({
            status: 200,
            response: results
        });

    });
})

router.get('/:ator_id', function(req, res) {
    pool.query('SELECT * FROM ator WHERE ator_id=?', [req.params.ator_id], function (error, results, fields) {
        if (!results[0]) {
            return res.status(404).send({
                status: 404,
                response: 'Actor not found.'
            });
        }

        return res.status(200).send({
            status: 200,
            response: results[0]
        });

    });
})

module.exports = router;
