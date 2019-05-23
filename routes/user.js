const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const router= express.Router();

var user_id;

// Route-wide middleware
router.use(function (req, res, next) {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({
        status: 401,
        response: 'Please include an access token in your request to allow authentication.'
    });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({
            status: 403,
            response: 'Expired or invalid access token.'
        });

        user_id = decoded.id;
        next();
    })
})

router.get('/myList', function(req, res) {
    pool.query("SELECT filme_user_list.*, filme_title, filme_poster, filme_ano, filme_duracao, realizador_nome FROM filme_user_list INNER JOIN filme ON filme_id = filme_user_list_filme_id INNER JOIN realizador ON filme_realizador_id = realizador_id WHERE filme_user_list_user_id = ?", [user_id], function (error, results, fields) {
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

router.post('/myList/verify', function (req, res) {
    if (parseInt(req.body.filme_id)) {
        pool.query("SELECT * FROM filme_user_list WHERE filme_user_list_filme_id = ? AND filme_user_list_user_id = ?", [req.body.filme_id, user_id], function (error, results, fields) {
            if (error) {
                return res.status(500).send({
                    status: 500,
                    response: "Database error. Please try again."
                })
            }

            if (results[0]) {
                return res.status(200).send({
                    status: 200,
                    response: {
                        filme_id: parseInt(req.body.filme_id),
                        watchlist: true
                    }
                })
            } else {
                return res.status(200).send({
                    status: 200,
                    response: {
                        filme_id: parseInt(req.body.filme_id),
                        watchlist: false
                    }
                })
            }
        })
    } else {
        return res.status(500).send({
            status: 400,
            response: 'You must include the movie ID in the body of the request.'
        })
    }
})

router.post('/myList/add', function (req, res) {
    if (parseInt(req.body.filme_id)) {
        pool.query("INSERT INTO filme_user_list (filme_user_list_filme_id, filme_user_list_user_id) VALUES (?, ?)", [req.body.filme_id, user_id], function (error, results, fields) {
            if (error) {
                if (error.errno == "1062") {
                    return res.status(400).send({
                        status: 400,
                        response: "Movie already on your list."
                    });
                }

                return res.status(500).send({
                    status: 500,
                    response: "Database error. Please try again."
                })
            }

            return res.status(200).send({
                status: 200,
                response: "Movie added successfully to your personal list."
            })
        });
    } else {
        return res.status(500).send({
            status: 400,
            response: 'You must include the movie ID in the body of the request.'
        })
    }
})

router.post('/myList/delete', function (req, res) {
    if (parseInt(req.body.filme_id)) {
        pool.query("DELETE FROM filme_user_list WHERE filme_user_list_filme_id = ? AND filme_user_list_user_id = ?", [req.body.filme_id, user_id], function (error, results, fields) {
            if (error) {
                return res.status(500).send({
                    status: 500,
                    response: "Database error. Please try again."
                })
            }

            return res.status(200).send({
                status: 200,
                response: "Movie removed successfully from your personal list."
            })
        });
    } else {
        return res.status(500).send({
            status: 400,
            response: 'You must include the movie ID in the body of the request.'
        })
    }
})

router.post('/review/like', function (req, res) {
    if (parseInt(req.body.filme_classificacao_id)) {
        pool.query("INSERT INTO filme_classificacao_score (filme_classificacao_score_filme_classificacao_id, filme_classificacao_score_user_id, filme_classificacao_score_updown) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE filme_classificacao_score_updown=1", [req.body.filme_classificacao_id, user_id], function (error, results, fields) {
            if (error) {
                if (error.errno == "1062") {
                    return res.status(400).send({
                        status: 400,
                        response: "You already have a score on this review."
                    });
                }

                return res.status(500).send({
                    status: 500,
                    response: "Database error. Please try again."
                })
            }

            return res.status(200).send({
                status: 200,
                response: "Like OK"
            })
        });
    } else {
        return res.status(500).send({
            status: 400,
            response: 'You must include the review ID in the body of the request.'
        })
    }
})

router.post('/review/dislike', function (req, res) {
    if (parseInt(req.body.filme_classificacao_id)) {
        pool.query("INSERT INTO filme_classificacao_score (filme_classificacao_score_filme_classificacao_id, filme_classificacao_score_user_id, filme_classificacao_score_updown) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE filme_classificacao_score_updown=0", [req.body.filme_classificacao_id, user_id], function (error, results, fields) {
            if (error) {
                if (error.errno == "1062") {
                    return res.status(400).send({
                        status: 400,
                        response: "You already have a score on this review."
                    });
                }

                return res.status(500).send({
                    status: 500,
                    response: "Database error. Please try again."
                })
            }

            return res.status(200).send({
                status: 200,
                response: "Dislike OK"
            })
        });
    } else {
        return res.status(500).send({
            status: 400,
            response: 'You must include the review ID in the body of the request.'
        })
    }
})

router.post('/review/add', function (req, res) {
    var filme_id = parseInt(req.body.filme_id);
    var titulo = req.body.filme_classificacao_titulo;
    var corpo = req.body.filme_classificacao_corpo;
    var roteiro = parseInt(req.body.filme_classificacao_roteiro);
    var atores = parseInt(req.body.filme_classificacao_atores);
    var cenario = parseInt(req.body.filme_classificacao_cenario);
    var execucao = parseInt(req.body.filme_classificacao_execucao);
    var data = moment().format('YYYY-MM-DD HH:mm:ss');

    var media = Number(Math.round((((roteiro + atores + cenario + execucao) / 4))+'e'+0)+'e-'+0);

    if (filme_id && titulo && corpo && roteiro && atores && cenario && execucao && data && media) {
        pool.query('INSERT INTO filme_classificacao (filme_classificacao_filme_id, filme_classificacao_user_id, filme_classificacao_titulo, filme_classificacao_corpo, filme_classificacao_roteiro, filme_classificacao_atores, filme_classificacao_cenario, filme_classificacao_execucao, filme_classificacao_media, filme_classificacao_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [filme_id, user_id, titulo, corpo, roteiro, atores, cenario, execucao, media, data], function (error, results, fields) {
            if (error) {
                if (error.errno == "1062") {
                    return res.status(400).send({
                        status: 400,
                        response: "You already have a review for this movie."
                    });
                }
                return res.status(500).send({
                    status: 500,
                    response: 'Database error. Please try again.'
                });
            }

            pool.query('INSERT INTO filme_classificacao_score (filme_classificacao_score_filme_classificacao_id, filme_classificacao_score_user_id, filme_classificacao_score_updown) VALUES (?, ?, ?)', [results.insertId, user_id, 1], function (error, results, fields)  {
                if (error) {
                    return res.status(500).send({
                        status: 500,
                        response: 'Database error. Please try again.'
                    })
                }
                return res.status(200).send({
                    status: 200,
                    response: 'Review sucessfully inserted.'
                });
            });
        });
    } else {
        return res.status(500).send({
            status: 400,
            response: 'Invalid request, please include all necessary data.'
        })
    }
})

router.get('/reviews', function (req, res) {
    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', sum(CASE WHEN filme_classificacao_score_updown = '1' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'liked', sum(CASE WHEN filme_classificacao_score_updown = '0' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'disliked', filme_title, filme_poster, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id WHERE filme_classificacao_user_id = ? GROUP BY filme_classificacao_id ORDER BY filme_classificacao_data DESC", [user_id, user_id, user_id], function (error, results, fields) {
        if (error) {
            return res.status(500).send({
                status: 500,
                response: error
            })
        }

        return res.status(200).send({
            status: 200,
            response: results
        })
    })
})

router.get('/reviews/new', function(req, res) {
    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', sum(CASE WHEN filme_classificacao_score_updown = '1' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'liked', sum(CASE WHEN filme_classificacao_score_updown = '0' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'disliked', filme_title, user_firstname, user_lastname, filme_poster, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id GROUP BY filme_classificacao_id ORDER BY filme_classificacao_data DESC LIMIT 5 OFFSET 0", [user_id, user_id], function (error, results, fields) {
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

router.get('/reviews/top', function(req, res) {
    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', sum(CASE WHEN filme_classificacao_score_updown = '1' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'liked', sum(CASE WHEN filme_classificacao_score_updown = '0' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'disliked', filme_title, user_firstname, user_lastname, filme_poster, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id GROUP BY filme_classificacao_id ORDER BY likes DESC LIMIT 5 OFFSET 0", [user_id, user_id], function (error, results, fields) {
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

router.get('/reviews/trending', function(req, res) {

    var data_trending = moment().subtract(2, 'days').format('YYYY-MM-DD HH:mm');
    var data_now = moment().format('YYYY-MM-DD HH:mm');

    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', sum(CASE WHEN filme_classificacao_score_updown = '1' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'liked', sum(CASE WHEN filme_classificacao_score_updown = '0' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'disliked', filme_title, user_firstname, user_lastname, filme_poster, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id WHERE filme_classificacao_data BETWEEN ? AND ? GROUP BY filme_classificacao_id ORDER BY likes DESC LIMIT 5 OFFSET 0", [user_id, user_id, data_trending, data_now], function (error, results, fields) {
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

router.get('/filme/reviews/:filme_id', function(req, res) {
    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', sum(CASE WHEN filme_classificacao_score_updown = '1' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'liked', sum(CASE WHEN filme_classificacao_score_updown = '0' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'disliked', filme_title, user_firstname, user_lastname, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id WHERE filme_classificacao_filme_id = ? GROUP BY filme_classificacao_id ORDER BY filme_classificacao_data DESC", [user_id, user_id, req.params.filme_id], function (error, result, fields) {
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

router.post('/privacy/change', function (req, res) {
    if (req.body.user_privacy >= 1 && req.body.user_privacy <= 3) {
        pool.query('UPDATE user SET user_privacy = ? WHERE user_id = ?', [req.body.user_privacy, user_id], function (error, result, fields) {
            if (error) {
                return res.status(500).send({
                    status: 500,
                    response: "Database error. Please try again."
                })
            }

            return res.status(200).send({
                status: 200,
                response: "Privacy settings changed successfully."
            })
        });
    } else {
        return res.status(400).send({
            status: 400,
            response: "Please include all neccessary data in your request and try again."
        })
    }
})

router.post('/profile/edit', function (req, res) {
    var user_firstname = req.body.user_firstname;
    var user_lastname = req.body.user_lastname;
    var user_data_nascimento = moment(req.body.user_data_nascimento).format('YYYY-MM-DD');
    var user_bio = req.body.user_bio;
    var user_sexo_id = req.body.user_sexo_id;
    var user_pais_id = req.body.user_pais_id;

    if (user_firstname && user_lastname && user_data_nascimento && user_bio && user_sexo_id && user_pais_id) {
        pool.query('UPDATE user SET user_firstname = ?, user_lastname = ?, user_data_nascimento = ?, user_bio = ?, user_sexo_id = ?, user_pais_id = ? WHERE user_id = ?', [user_firstname, user_lastname, user_data_nascimento, user_bio, user_sexo_id, user_pais_id, user_id], function (error, results, fields) {
            if (error) {
                return res.status(500).send({
                    status: 500,
                    response: "Database error."
                });
            }

            return res.status(200).send({
                status: 200,
                response: "Update success."
            })
        });
    } else {
        return res.status(400).send({
            status: 400,
            response: "Invalid request."
        })
    }
})

router.get('/reviews/users/:user_id', function (req, res) {
    pool.query("SELECT sum(CASE filme_classificacao_score_updown WHEN '1' THEN 1 ELSE 0 END) AS 'likes', sum(CASE filme_classificacao_score_updown WHEN '0' THEN 1 ELSE 0 END ) AS 'dislikes', sum(CASE WHEN filme_classificacao_score_updown = '1' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'liked', sum(CASE WHEN filme_classificacao_score_updown = '0' AND filme_classificacao_score_user_id = ? THEN 1 ELSE 0 END ) AS 'disliked', filme_title, user_firstname, user_lastname, filme_poster, filme_classificacao.* FROM filme_classificacao LEFT JOIN filme ON filme_id = filme_classificacao_filme_id LEFT JOIN filme_classificacao_score ON filme_classificacao_score_filme_classificacao_id = filme_classificacao_id LEFT JOIN user ON filme_classificacao_user_id = user_id WHERE filme_classificacao_user_id = ? GROUP BY filme_classificacao_id ORDER BY filme_classificacao_data DESC", [user_id, user_id, req.params.user_id], function (error, results, fields) {
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

router.get('/pais/list', function (req, res) {
    pool.query('SELECT * FROM pais', function (error, results) {
        if (error) return res.status(500).send({
            status: 500,
            response: "Database error. Please try again."
        })

        return res.status(200).send({
            status: 200,
            response: results
        })
    })
})

module.exports = router;
