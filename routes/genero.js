const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router= express.Router();

router.get('/', function(req, res) {
    pool.query('SELECT genero_id, genero_descricao FROM filme_genero INNER JOIN genero ON genero_id = filme_genero_genero_id GROUP BY genero_id', function (error, results, fields) {
        if (!results[0]) {
            return res.status(404).send({
                status: 404,
                response: 'Genre not found.'
            });
        }

        return res.status(200).send({
            status: 200,
            response: results
        });

    });
})

router.get('/:genero_id/size/:size/page/:page', function (req, res) {
    var size = req.params.size;
    var page = req.params.page;
    if (size >= 1 && page >= 1) {
        pool.query('SELECT filme.filme_id, filme_genero_genero_id, filme.filme_title, filme.filme_poster FROM filme_genero INNER JOIN filme ON filme_genero_filme_id = filme.filme_id WHERE filme_genero_genero_id = ? GROUP BY filme.filme_id ORDER BY filme_data_estreia DESC LIMIT ? OFFSET ?', [req.params.genero_id, parseInt(size), (page - 1) * size], function (error, results, fields) {
            if (error) {
                return res.status(500).send({
                    status: 500,
                    respose: error
                });
            }
            if (!results[0]) {
                return res.status(404).send({
                    status: 404,
                    response: 'Movies not found.'
                });
            }

            return res.status(200).send({
                status: 200,
                response: results
            });
        });
    } else {
        return res.status(400).send({
            status: 400,
            response: "Incorrect query, result size and number page must be >= 1"
        });
    }
})

module.exports = router;
