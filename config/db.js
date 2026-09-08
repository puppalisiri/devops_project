const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Siri@123',
    database: 'telangana_tourism'
});

connection.connect((err) => {

    if (err) {
        console.log(err);
    } else {
        console.log('MySQL Connected');
    }

});

module.exports = connection;