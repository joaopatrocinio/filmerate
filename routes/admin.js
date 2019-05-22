const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mdb = require('moviedb')(process.env.TMDB_API_KEY);
const moment = require('moment');
const faker = require('faker');
const router = express.Router();

// Route-wide middleware
/*router.use(function (req, res, next) {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({
        status: 401,
        response: 'Please include an access token in your request to allow authentication.'
    });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({
            status: 500,
            response: 'Expired or invalid access token.'
        });

        // Admin account check
        if (decoded.user_type == 1) next()
        else res.status(403).send({
            status: 403,
            response: 'Your account type is not allowed to make this request.'
        });
    })
})*/

router.get("/faker/newUser", function (req, res) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(faker.internet.password(), salt);
    pool.query('INSERT INTO user (user_firstname, user_lastname, user_email, user_password, user_user_type_id, user_data_nascimento, user_sexo_id, user_pais_id, user_bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [faker.name.firstName(), faker.name.lastName(), faker.internet.email(), hash, 2, moment(faker.date.past()).format('YYYY-MM-DD'), Math.floor(Math.random() * 2) + 1, 177, faker.lorem.paragraph()], function (error, results, fields) {
        if (error) {
            return res.status(500).send({
                status: 500,
                response: "Database error, please try again."
            });
        }

        return res.status(200).send({
            status: 200,
            response: 'Fake user inserted.'
        });
    });
});

router.get('/stats', function (req, res) {
    pool.query('SELECT COUNT(filme.filme_id) AS "filmes_total" FROM filme; SELECT COUNT(user.user_id) AS "users_total" FROM user; SELECT COUNT(ator.ator_id) AS "actors_total" FROM ator; SELECT COUNT(realizador.realizador_id) AS "directors_total" FROM realizador;', function (error, results, fields) {
        if (error) {
            return res.status(500).send({
                status: 500,
                response: "Database error, please try again."
            });
        }

        return res.status(200).send({
            status: 200,
            response: {
                filmes_total: results[0][0].filmes_total,
                users_total: results[1][0].users_total,
                actors_total: results[2][0].actors_total,
                directors_total: results[3][0].directors_total
            }
        });
    });
});

router.get('/users', function (req, res) {
    pool.query('SELECT user_id, user_firstname, user_lastname, user_email, user_user_type_id FROM user', function (error, results, fields) {
        if (error) {
            return res.status(500).send({
                status: 500,
                response: 'An error occured while trying to add a record on the database. Please try again.'
            });
        }

        return res.status(200).send({
            status: 200,
            response: results
        });
    });
})

router.post('/filme/edit', function (req, res) {
    var filme_id = req.body.filme_id;
    var filme_title = req.body.filme_title;
    var filme_sinopse = req.body.filme_sinopse || null;
    var filme_duracao = req.body.filme_duracao || null;
    var filme_data_estreia = moment(req.body.filme_data_estreia).format('YYYY-MM-DD');
    var filme_ano = moment(filme_data_estreia).format('YYYY');
    var filme_poster = req.body.filme_poster;

    if (filme_id && filme_title && filme_data_estreia && filme_poster) {
        pool.query('UPDATE filme SET filme_title = ?, filme_sinopse = ?, filme_duracao = ?, filme_data_estreia = ?, filme_poster = ?, filme_ano = ? WHERE filme_id = ?', [filme_title, filme_sinopse, filme_duracao, filme_data_estreia, filme_poster, filme_ano, filme_id], function (error, results, fields) {
            if (error) {
                return res.status(500).send({
                    status: 500,
                    response: "Database error. Please try again."
                })
            }

            return res.status(200).send({
                status: 200,
                response: "Update success."
            })
        });
    } else {
        return res.status(400).send({
            status: 400,
            response: "Please include all necessary data to edit this movie."
        });
    }
});

router.post('/scrape/:filme_imdb', function (req, res) {
    var filme_id;

    mdb.find({
        id: req.params.filme_imdb,
        external_source: 'imdb_id'
    }, (err, data) => {
        if (data.movie_results[0]) {
            mdb.movieInfo({
                id: data.movie_results[0].id
            }, (err, movie) => {
                pool.query('INSERT INTO filme (filme_imdb, filme_title, filme_sinopse, filme_data_estreia, filme_duracao, filme_poster, filme_ano) VALUES (?, ?, ?, ?, ?, ?, ?)', [movie.imdb_id, movie.title, movie.overview, moment(movie.release_date).format('YYYY-MM-DD'), movie.runtime, 'https://image.tmdb.org/t/p/w500' + movie.poster_path, moment(movie.release_date).format('YYYY')], function (error, results, fields) {
                    if (error) {
                        if (error.errno == "1062") {
                            return res.status(500).send({
                                status: 500,
                                response: "Movie already exists on the database."
                            });
                        }

                        return res.status(500).send({
                            status: 500,
                            response: 'An error occured while trying to add a record on the database. Please try again.'
                        });
                    }

                    filme_id = results.insertId;

                    // genres
                    for (i = 0; i < movie.genres.length; i++) {
                        pool.query('SELECT * FROM genero WHERE genero_tmdb_id = ?', [movie.genres[i].id], function (error, results, fields) {
                            if (error) {
                                return res.status(500).send({
                                    status: 500,
                                    response: 'Database error. Please try again.'
                                });
                            }

                            pool.query('INSERT INTO filme_genero (filme_genero_filme_id, filme_genero_genero_id) VALUES (?, ?)', [filme_id, results[0].genero_id], function (error, results, fields) {
                                if (error) {
                                    return res.status(500).send({
                                        status: 500,
                                        response: 'Database error. Please try again.'
                                    });
                                }
                            });
                        });
                    }

                    mdb.movieCredits({
                        id: data.movie_results[0].id
                    }, (err, credits) => {
                        function isDirector(crew) {
                            return crew.job == "Director";
                        }
                        // director
                        pool.query('SELECT realizador_id FROM realizador WHERE realizador_tmdb_id=?', [credits.crew.find(isDirector).id], (error, results, fields) => {
                            if (error) {
                                return res.status(500).send({
                                    status: 500,
                                    response: 'An error occured.'
                                });
                            }

                            if (!results[0]) {
                                mdb.personInfo({
                                    id: credits.crew.find(isDirector).id
                                }, (err, director) => {
                                    pool.query('INSERT INTO realizador (realizador_tmdb_id, realizador_nome, realizador_data_nascimento, realizador_imdb_id, realizador_biografia, realizador_imagem) VALUES (?, ?, ?, ?, ?, ?)', [director.id, director.name, director.birthday, director.imdb_id, director.biography, 'https://image.tmdb.org/t/p/w500' + director.profile_path],
                                        function (error, resultsInsert, fields) {
                                            if (error) {
                                                return res.status(500).send({
                                                    status: 500,
                                                    response: "An error occured while inserting the director on the database."
                                                });
                                            } else {
                                                pool.query('UPDATE filme SET filme_realizador_id=? WHERE filme_imdb=?', [resultsInsert.insertId, req.params.filme_imdb], (error, results, fields) => {
                                                    if (error) {
                                                        return res.status(500).send({
                                                            status: 500,
                                                            response: "An error occured while linking the director to the movie."
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                });
                            } else {
                                pool.query('UPDATE filme SET filme_realizador_id=? WHERE filme_imdb=?', [results[0].realizador_id, req.params.filme_imdb], (error, results, fields) => {
                                    if (error) {
                                        return res.status(500).send({
                                            status: 500,
                                            response: "An error occured while linking the director to the movie."
                                        });
                                    }
                                });
                            }
                        });
                        // actors
                        var cast_id = [];
                        for (i = 0; i < 3; i++) {
                            cast_id.push(credits.cast[i].id);
                        }

                        // synchronously adding actors to the database
                        var index = 0;

                        function loadCast() {
                            if (index < cast_id.length) {
                                pool.query('SELECT ator_id FROM ator WHERE ator_tmdb_id=?', [cast_id[index]], (error, results, fields) => {
                                    if (error) {
                                        return res.status(500).send({
                                            status: 500,
                                            response: 'An error occured.'
                                        });
                                    }

                                    if (!results[0]) {
                                        mdb.personInfo({
                                            id: cast_id[index]
                                        }, (err, actor) => {
                                            pool.query('INSERT INTO ator (ator_tmdb_id, ator_nome, ator_data_nascimento, ator_imdb_id, ator_biografia, ator_imagem) VALUES (?, ?, ?, ?, ?, ?)', [actor.id, actor.name, actor.birthday, actor.imdb_id, actor.biography, 'https://image.tmdb.org/t/p/w500' + actor.profile_path],
                                                function (error, resultsInsert, fields) {
                                                    if (error) {
                                                        return res.status(500).send({
                                                            status: 500,
                                                            response: "An error occured while inserting the actor on the database."
                                                        });
                                                    } else {
                                                        pool.query('INSERT INTO filme_ator (filme_ator_filme_id, filme_ator_ator_id) VALUES (?, ?)', [filme_id, resultsInsert.insertId], (error, results, fields) => {
                                                            if (error) {
                                                                return res.status(500).send({
                                                                    status: 500,
                                                                    error: error
                                                                });
                                                            }
                                                            ++index;
                                                            loadCast();
                                                        });
                                                    }
                                                });
                                        });
                                    } else {
                                        pool.query('INSERT INTO filme_ator (filme_ator_filme_id, filme_ator_ator_id) VALUES (?, ?)', [filme_id, results[0].ator_id], (error, results, fields) => {
                                            if (error) {
                                                return res.status(500).send({
                                                    status: 500,
                                                    error: error
                                                });
                                            }
                                            ++index;
                                            loadCast();
                                        });
                                    }
                                });
                            } else {
                                return res.status(200).send({
                                    status: 200,
                                    response: "Database insert completed successfully."
                                });
                            }
                        }
                        loadCast();
                    });
                });
            });
        }
    });
})

module.exports = router;
