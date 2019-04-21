const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router= express.Router();

router.get('/', function(req, res) {
    pool.query('SELECT filme_id, filme_title, filme_poster FROM filme ORDER BY filme_data_estreia DESC', function (error, results, fields) {
        if (error) return res.status(500).send({
            status: 500,
            response: 'Database error. Please try again.'
        });

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
})

router.get('/count', function (req, res) {
	pool.query("SELECT COUNT(filme_id) AS 'filmes_count' FROM filme", function (error, results, fields) {
		if (error) {
			return res.status(500).send({
				status: 500,
				response: "Database error. Please try again."
			});
		}
		
		return res.status(200).send({
			status: 200,
			response: results[0]
		});
	});
});

router.get('/size/:size/page/:page', function (req, res) {
    var size = req.params.size;
    var page = req.params.page;
    if (size >= 1 && page >= 1) {
        pool.query('SELECT filme_id, filme_title, filme_poster FROM filme ORDER BY filme_data_estreia DESC LIMIT ? OFFSET ?', [parseInt(size), (page - 1) * size], function(error, results, fields) {
            if (error) return res.status(500).send({
                status: 500,
                response: "Database error. Please try again."
            });

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
});

router.get('/:filme_id', function(req, res) {
    pool.query('SELECT filme.*, realizador.realizador_nome FROM filme LEFT JOIN realizador ON filme.filme_realizador_id = realizador.realizador_id WHERE filme_id = ?', [req.params.filme_id], function (error, results, fields) {
        if (error) return res.status(500).send({
            status: 500,
            response: 'Database error. Please try again.'
        });

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
})

router.get('/reviews/:filme_id', function(req, res) {
    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', filme_title, user_firstname, user_lastname, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id WHERE filme_classificacao_filme_id = ? GROUP BY filme_classificacao_id ORDER BY filme_classificacao_data DESC", [req.params.filme_id], function (error, result, fields) {
        if (error) {
            return res.status(500).send({
                status: 500,
                response: "Database error. Please try again."
            });
        }

        if (result[0]) {
            return res.status(200).send({
                status: 200,
                response: result
            });
        } else {
            return res.status(404).send({
                status: 404,
                response: "No reviews found for that movie."
            });
        }
    });
})

router.get('/atores/:filme_id', function (req, res) {
    pool.query('SELECT filme_id, ator_id, ator_nome FROM filme LEFT JOIN filme_ator ON filme_ator.filme_ator_filme_id = filme.filme_id LEFT JOIN ator ON ator.ator_id = filme_ator.filme_ator_ator_id WHERE filme.filme_id = ?', [req.params.filme_id], function (error, results, fields) {
        if (error) return res.status(500).send({
            status: 500,
            response: 'Database error. Please try again.'
        });

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
})

router.get('/generos/:filme_id', function (req, res) {
    pool.query('SELECT filme_id, genero_descricao FROM filme LEFT JOIN filme_genero ON filme_genero.filme_genero_filme_id = filme.filme_id LEFT JOIN genero ON genero.genero_id = filme_genero.filme_genero_genero_id WHERE filme.filme_id = ? ORDER BY genero_id', [req.params.filme_id], function (error, results, fields) {
        if (error) return res.status(500).send({
            status: 500,
            response: 'Database error. Please try again.'
        });

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
})

router.get('/search/:query/size/:size/page/:page', function (req, res) {
    var size = req.params.size;
    var page = req.params.page;
    if (size >= 1 && page >= 1) {
        pool.query("SELECT filme_id, filme_title, filme_poster FROM filme WHERE filme_title LIKE '%" + this.escape(req.params.query) + "%' ORDER BY filme_data_estreia DESC LIMIT ? OFFSET ?", [parseInt(size), (page - 1) * size], function (error, results, fields) {
            if (error) return res.status(500).send({
                status: 500,
                response: error
            });

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
    } else {
        return res.status(400).send({
            status: 400,
            response: "Incorrect query, result size and number page must be >= 1"
        });
    }
});

router.get('/media/:filme_id', function (req, res) {
    pool.query("SELECT avg(filme_classificacao_media) AS 'filme_reviews_avg' FROM filme_classificacao WHERE filme_classificacao_filme_id = ? GROUP BY filme_classificacao_filme_id", [req.params.filme_id], function (error, result, fields) {
        if (error) return res.status(500).send({
            status: 500,
            response: error
        });

        if (!result[0]) {
            return res.status(404).send({
                status: 404,
                response: "Movie not found, or movie doesn't have any reviews."
            });
        }

        return res.status(200).send({
            status: 200,
            response: result
        });
    });
})

module.exports = router;
