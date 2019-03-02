const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mdb = require('moviedb')(process.env.TMDB_API_KEY);
const moment = require('moment');
const router= express.Router();

router.post('/:filme_imdb', function (req, res) {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({
        status: 401,
        response: 'Please include an access token in your request to allow authentication.'
    });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({
            status: 500,
            response: 'An error occured while trying to decode your access token. Please try again.'
        });
        
        mdb.find({ id: req.params.filme_imdb, external_source: 'imdb_id'}, (err, data) => {
            if (data.movie_results[0]) {
                mdb.movieInfo({ id: data.movie_results[0].id }, (err, movie) => {
                    pool.getConnection(function (err, connection) {
                        if (err) return res.status(500).send({
                            status: 500,
                            response: 'Database error. Please try again.'
                        });
                        connection.query('INSERT INTO filme (filme_imdb, filme_title, filme_sinopse, filme_data_estreia, filme_duracao, filme_poster) VALUES (?, ?, ?, ?, ?, ?)', [movie.imdb_id, movie.original_title, movie.overview, moment(movie.release_date).format('YYYY-MM-DD'), movie.runtime, 'https://image.tmdb.org/t/p/w500' + movie.poster_path], function (error, results, fields) {
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
        
                            return res.status(200).send({
                                status: 200,
                                response: results
                            });
                        });
                        connection.release();
                    });
                });
            } else {
                res.status(404).send({
                    status: 404,
                    response: 'Movie not found.'
                });
            }
        });
    })
})

module.exports = router;