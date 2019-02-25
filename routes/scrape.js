const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const imdb = require('imdb-api');
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
        
        imdb.get({id: req.params.filme_imdb}, {apiKey: process.env.OMDB_API_KEY}).then((data) => {
            pool.getConnection(function (err, connection) {
                if (err) return res.status(500).send({
                    status: 500,
                    response: 'Database error. Please try again.'
                });
                connection.query('INSERT INTO filme (filme_imdb, filme_title, filme_sinopse, filme_data_estreia, filme_duracao, filme_poster) VALUES (?, ?, ?, ?, ?, ?)', [data.imdbid, data.title, data.plot, moment(data.released).format('YYYY-MM-DD'), data.runtime.split(" ")[0], data.poster], function (error, results, fields) {
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
    })
})

module.exports = router;