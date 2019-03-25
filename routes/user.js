const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
            status: 500,
            response: 'An error occured while trying to decode your access token. Please try again.'
        });

        user_id = decoded.id;
        next();
    })
})

router.get('/myList', function(req, res) {
    pool.query("SELECT filme_user_list.*, filme_title, filme_poster FROM filme_user_list INNER JOIN filme ON filme_id = filme_user_list_filme_id WHERE filme_user_list_user_id = ?", [user_id], function (error, results, fields) {
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

router.post('/myList/add', function (req, res) {
    if (req.body.filme_id) {
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
    if (req.body.filme_id) {
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

module.exports = router;
