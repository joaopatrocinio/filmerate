const express = require("express");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql');

require('dotenv').config()
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const auth = require('./routes/auth');

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

app.use('/api/auth', auth)

app.listen(3000, () => {
    console.log("Server running on port 3000");
});