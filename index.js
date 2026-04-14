const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Sunucunun uyanık olup olmadığını test edeceğimiz basit bir sayfa
app.get('/', (req, res) => {
    res.send('Mailmaster Sunucusu 7/24 Ayakta ve Nöbette!');
});

// Sunucuyu başlatıyoruz
app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor...`);
});
