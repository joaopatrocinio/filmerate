const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const router = express.Router();

router.post('/login', function(req, res, next) {
    if (req.body.user_email && req.body.user_password) {
        pool.getConnection(function (err, connection) {
            if (err) return res.status(500).send({
                status: 500,
                response: 'Database error. Please try again.'
            });
        
            connection.query('SELECT * from user WHERE user_email = ?', [req.body.user_email], function (error, results, fields) {
                if (!results[0]) {
                    return res.status(401).send({
                        status: 401,
                        response: 'Authentication failed, incorrect credencials.'
                    });
                }
                var passwordIsValid = bcrypt.compareSync(req.body.user_password, results[0].user_password);
                if (!passwordIsValid) {
                    return res.status(401).send({
                        status: 401,
                        response: 'Authentication failed, incorrect credencials.'
                    });
                }
                var token = jwt.sign({
                    id: results[0].user_id,
                    user_type: results[0].user_user_type_id
                }, process.env.JWT_SECRET, {
                    expiresIn: 6064800 // expires in 1 week
                });
                res.status(200).send({
                    status: 200,
                    response: 'Authentication success.',
                    token: token
                });
            });
            connection.release();
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
        status: 401,
        response: 'Please include an access token in your request to allow authentication.'
    });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send({
            status: 500,
            response: 'An error occured while trying to decode your access token. Please try again.'
        });
        pool.getConnection(function (err, connection) {
            if (err) return res.status(500).send({
                status: 500,
                response: 'Database error. Please try again.'
            });
            connection.query('SELECT user_id, user_firstname, user_lastname, user_email, user_user_type_id, user_data_nascimento, user_sexo_id, sexo_descricao, user_pais_id, pais_nome, user_privacy, user_bio FROM user LEFT JOIN pais ON user.user_pais_id = pais.pais_id LEFT JOIN sexo ON user.user_sexo_id = sexo.sexo_id WHERE user_id = ?', [decoded.id], function (error, results, fields) {
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
            connection.release();
        });
    })
})

router.post('/register', function (req, res, next) {
    if (
        !req.body.user_firstname ||
        !req.body.user_lastname ||
        !req.body.user_email ||
        !req.body.user_password ||
        !req.body.user_data_nascimento ||
        !req.body.user_sexo_id
    ) {
        return res.status(400).send({
            status: 400,
            response: 'You are missing necessary data to complete the sign up.'
        });
    }

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.user_password, salt);

    pool.getConnection(function (err, connection) {
        if (err) return res.status(500).send({
            status: 500,
            response: 'Database error. Please try again.'
        });

        connection.query("INSERT INTO user (user_firstname, user_lastname, user_email, user_password, user_user_type_id, user_data_nascimento, user_sexo_id, user_pais_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
            req.body.user_firstname,
            req.body.user_lastname,
            req.body.user_email,
            hash,
            2, // user type => 2 = regular user
            req.body.user_data_nascimento,
            req.body.user_sexo_id,
            177 // user_pais_id => portugal
        ], function(errors, results, fields) {
            if (errors) {
                if (errors.errno == "1062") {
                    return res.status(500).send({
                        status: 500,
                        response: "Email address already registered on the database."
                    });
                }
                return res.status(500).send({
                    status: 500,
                    response: 'An error occured while trying to create a new user.'
                });
            }
            var email_registo = fs.createReadStream("public/email_registo.html");
            let mailOptions = {
              from: '"FilmeRate" <admin@filmerate.com>', // sender address
              to: req.body.user_email, // list of receivers
              subject: "Criação de conta FilmeRate", // Subject line
              text: "Parabens. A sua conta foi criada com sucesso. Agora já pode fazer as suas próprias reviews, seguir filmes ou pessoas no website para receber as suas últimas notícias, votar em reviews, e mais.", // plain text body
              html: email_registo // html body
            };
        
            // send mail with defined transport object
            let info = smtpTransport.sendMail(mailOptions)
            return res.status(200).send({
                status: 200,
                response: 'User created successfully.'
            });
        });
        connection.release();
    });
});

module.exports = router;