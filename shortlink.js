// shortlink.js
const express = require('express');

const router = express.Router();

const mysql = require('mysql2/promise');

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3307, // If your MySQL server is running on a different port, specify it here
    user: 'root',
    password: 'qazxsw1234.',
    database: 'shortlinks'
});

const urlRegex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i;


// Function to generate a random string of characters
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

router.get('/', (req, res) => {
    res.send(`
        <form action="/shortlink/generate" method="post">
            <label for="inputText">Enter Text:</label>
            <input type="text" id="inputText" name="inputText">
            <button type="submit">Generate Short Link</button>
        </form>
    `);
});

router.all('/generate', async (req, res) => {
    // Get the input text from the form submission
    const inputText = req.body.inputText;

    // check is link
    const isURL = urlRegex.test(inputText);

    if (!isURL) {
        return res.status(400).send('Input is not a valid URL');
    }

    // Calculate expiration date (1 year from now)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() - 1);

    // Create a MySQL connection from the pool
    const connection = await pool.getConnection();

    try {
        // Check for duplicates within the last year
        const [existingShortLinks] = await connection.query('SELECT * FROM short_links WHERE input_text = ? AND created_at > ?', [inputText, expirationDate]);

        let shortString;
        if (existingShortLinks.length > 0) {
            // If duplicates found, regenerate short link
            // shortString = generateRandomString(5);
            shortString = existingShortLinks[0].short_string;
        } else {
            // If no duplicates found, generate a new short link
            shortString = generateRandomString(5);

            // Insert data into the database
            await connection.query('INSERT INTO short_links (input_text, short_string, created_at) VALUES (?, ?, ?)', [inputText, shortString, new Date()]);
        }

        // Construct the short link URL
        const host = req.headers.host;
        const shortLinkURL = `http://${host}/${shortString}`;

        res.send(`${shortLinkURL}`);
    } catch (error) {
        console.error('Error saving to database:', error);
        res.status(500).send('Internal Server Error');
    } finally {
        connection.release(); // Release the connection back to the pool
    }
});

module.exports = router;
