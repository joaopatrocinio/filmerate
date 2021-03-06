const express = require('express');
const moment = require('moment');
const router= express.Router();

router.get('/new', function(req, res) {
    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', filme_title, user_firstname, user_lastname, filme_poster, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id GROUP BY filme_classificacao_id ORDER BY filme_classificacao_data DESC", function (error, results, fields) {
        if (!results[0]) {
            return res.status(404).send({
                status: 404,
                response: 'Reviews not found.'
            });
        }

        return res.status(200).send({
            status: 200,
            response: results
        });

    });
})

router.get('/top', function(req, res) {
    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', filme_title, user_firstname, user_lastname, filme_poster, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id GROUP BY filme_classificacao_id ORDER BY likes DESC", function (error, results, fields) {
        if (!results[0]) {
            return res.status(404).send({
                status: 404,
                response: 'Reviews not found.'
            });
        }

        return res.status(200).send({
            status: 200,
            response: results
        });

    });
})

router.get('/trending', function(req, res) {

    var data_trending = moment().subtract(2, 'days').format('YYYY-MM-DD HH:mm');
    var data_now = moment().format('YYYY-MM-DD HH:mm');

    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', filme_title, user_firstname, user_lastname, filme_poster, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id WHERE filme_classificacao_data BETWEEN ? AND ? GROUP BY filme_classificacao_id ORDER BY likes DESC", [data_trending, data_now], function (error, results, fields) {
        if (error) {
            return res.status(500).send({
                status: 500,
                response: error
            })
        }
        if (!results[0]) {
            return res.status(404).send({
                status: 404,
                response: 'Reviews not found.'
            });
        }
        return res.status(200).send({
            status: 200,
            response: results
        });
    });
})

router.post('/report', function (req, res) {
    var data_now = moment().format('YYYY-MM-DD HH:mm');
    if (
        !req.body.filme_classificacao_id ||
        !req.body.filme_report_motivo
    ) {
        return res.status(400).send({
            status: 400,
            response: "Please include all necessary data for this request and try again."
        })
    } else {
        pool.query('INSERT INTO filme_report (filme_report_filme_classificacao_id, filme_report_motivo, filme_report_data) VALUES (?, ?, ?)', [req.body.filme_classificacao_id, req.body.filme_report_motivo, data_now], function (error, results) {
            if (error) return res.status(500).send({
                status: 500,
                response: "Database error. Please try again."
            })

            return res.status(200).send({
                status: 200,
                response: "Report inserted successfully",
                filme_report_id: results.insertId
            })
        })
    }
})

module.exports = router;
