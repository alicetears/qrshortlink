// app.js
const express = require('express');
const qrgen = require('./qrgen');
const shortlink = require('./shortlink');

const app = express();
const port = process.env.PORT || 3002;

const mysql = require('mysql2/promise');

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3307, // If your MySQL server is running on a different port, specify it here
    user: 'root',
    password: 'qazxsw1234.',
    database: 'shortlinks'
});

app.use(express.urlencoded({ extended: true }));

// Define routes
app.use('/qrgen', qrgen);
app.use('/shortlink', shortlink);

// Route to handle redirecting from short link to original URL
app.get('/:shortString', async (req, res) => {
    const shortString = req.params.shortString;

    // Create a MySQL connection from the pool
    const connection = await pool.getConnection();

    try {
        // Query the database for the original URL using the short string
        const [result] = await connection.query('SELECT input_text FROM short_links WHERE short_string = ?', [shortString]);

        if (result.length === 0) {
            res.status(404).send('Short link not found');
            return;
        }

        // Redirect to the original URL
        res.redirect(result[0].input_text);
    } catch (error) {
        console.error('Error retrieving original URL from database:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        connection.release(); // Release the connection back to the pool
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
