const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router= express.Router();

router.get('/:user_id', function(req, res) {
    pool.query('SELECT user_id, user_firstname, user_lastname, user_data_nascimento, user_sexo_id, user_pais_id, user_bio, user_privacy, sexo_descricao, pais_nome FROM user LEFT JOIN sexo ON sexo.sexo_id = user.user_sexo_id LEFT JOIN pais ON pais.pais_id = user.user_pais_id WHERE user_id = ?', [req.params.user_id], function (error, results, fields) {
        if (!results[0]) {
            return res.status(404).send({
                status: 404,
                response: 'User not found.'
            });
        }

        if (results[0].user_privacy == 1) {
            return res.status(200).send({
                status: 200,
                response: results[0]
            });
        } else if (results[0].user_privacy == 2) {
            var token = req.headers['x-access-token'];
            if (!token) return res.status(403).send({
                status: 403,
                response: "Only logged in users can view this user's profile."
            });
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) return res.status(500).send({
                    status: 403,
                    response: 'Expired or invalid access token.'
                });

                user_id = decoded.id;

                return res.status(200).send({
                    status: 200,
                    response: results[0]
                });
            })
        } else {
            return res.status(403).send({
                status: 403,
                response: "This profile is private."
            });
        }
    });
})

router.get('/:user_id/reviews', function (req, res) {
    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', filme_title, user_firstname, user_lastname, filme_poster, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id WHERE filme_classificacao_user_id = ? GROUP BY filme_classificacao_id ORDER BY filme_classificacao_data DESC", [req.params.user_id], function (error, results, fields) {
        if (error) {
            return res.status(500).send({
                status: 500,
                response: "Database error. Please try again."
            });
        }

        if (results[0]) {
            return res.status(200).send({
                status: 200,
                response: results
            });
        } else {
            return res.status(404).send({
                status: 404,
                response: "Reviews not found."
            })
        }
    });
})

module.exports = router;
