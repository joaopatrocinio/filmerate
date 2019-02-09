const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.post('/login', function(req, res, next) {
    if (req.body.user_email && req.body.user_password) {
        connection.query('SELECT * from user WHERE user_email = ?', [req.body.user_email], function (error, results, fields) {
            var passwordIsValid = bcrypt.compareSync(req.body.user_password, results[0].user_password);
            if (!passwordIsValid) {
                return res.status(401).send({
                    status: 401,
                    response: 'Authentication failed, incorrect credencials.'
                });
            }
            var token = jwt.sign({
                id: results[0].user_id
            }, process.env.JWT_SECRET, {
                expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).send({
                status: 200,
                response: 'Authentication success.',
                token: token
            });
        });
    } else {
        return res.status(400).send({
            status: 400,
            response: 'Bad request, check documentation for proper request usage.'
        });
    }
});

router.get('/me', function (req, res, next) {
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({
        status: 400,
        response: 'Please include an access token in your request to allow authentication.'
    });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({
            status: 500,
            response: 'An error occured while trying to decode your access token. Please try again.'
        });
        connection.query('SELECT user_id, user_firstname, user_lastname, user_email, user_user_type_id, user_data_nascimento, user_sexo_id from user WHERE user_id = ?', [decoded.id], function (error, results, fields) {
            if (!results[0]) {
                return res.status(404).send({
                    status: 404,
                    response: 'Access token refers to a user that no longer exists.'
                });
            }
            return res.status(200).send({
                status: 200,
                response: results[0]
            });
        });
    })
})

module.exports = router;