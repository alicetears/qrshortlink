// qrgen.js
const express = require('express');
const qr = require('qrcode');

const router = express.Router();

router.get('/', (req, res) => {
    const text = req.query.text;
    // size
    const size = req.query.size || 200;

    qr.toDataURL(text, { width: size, height: size }, (err, url) => {
        if (err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        res.send({url});
    });
});

module.exports = router;
