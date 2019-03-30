const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');
const mailer = require('nodemailer');
const faker = require('faker');

require('dotenv').config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
faker.locale = process.env.FAKER_LOCALE;

// DB
global.pool = mysql.createPool({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PASS,
  database : process.env.DB_NAME,
  multipleStatements: true
});

pool.on('enqueue', function () {
  console.log('A MySQL query is in queue, this means the maximum value for connections has been reached.');
});

// Email
global.smtpTransport = mailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
});

const auth = require('./routes/auth');
const filme = require('./routes/filme');
const admin = require('./routes/admin');
const ator = require('./routes/ator');
const realizador = require('./routes/realizador');
const genero = require('./routes/genero');
const review = require('./routes/review');
const ano = require('./routes/ano');
const user = require('./routes/user');
app.use('/api/auth', auth)
app.use('/api/filme', filme)
app.use('/api/admin', admin)
app.use('/api/ator', ator)
app.use('/api/realizador', realizador)
app.use('/api/genero', genero)
app.use('/api/review', review)
app.use('/api/ano', ano)
app.use('/api/user', user)

app.get('/', (req, res, next) => {
	res.send("Servidor do site filmerate.com");
});
app.get('/api', (req, res, next) => {
	res.send("API do FilmeRate");
});

app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
});
