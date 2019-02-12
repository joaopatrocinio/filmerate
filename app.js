const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');

require('dotenv').config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req, res, next){
	global.connection = mysql.createConnection({
		host     : process.env.DB_HOST,
		user     : process.env.DB_USER,
		password : process.env.DB_PASS,
		database : process.env.DB_NAME
	});
	connection.connect();
	next();
});

const auth = require('./routes/auth');
app.use('/api/auth', auth)

app.get('/', (req, res, next) => {
	res.send("Servidor do site filmerate.com");
});
app.get('/api', (req, res, next) => {
	res.send("API do FilmeRate");
});

app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
});