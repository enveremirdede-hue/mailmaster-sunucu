const express = require('express');
const admin = require('firebase-admin');

// Render'ın gizli kasasından Firebase şifremizi alıyoruz
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

// Sistemi başlatıyoruz (Senin veritabanı adresini kodun içine ekledim)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mailmaster-62785-default-rtdb.firebaseio.com"
});

const db = admin.database();
const app = express();
const port = process.env.PORT || 3000;

// Sunucunun ayakta olup olmadığını test etmek için basit bir ekran
app.get('/', (req, res) => {
    res.send('Mailmaster Bildirim Bekçisi 7/24 Görevde! 🚀');
});

// GECE BEKÇİSİ MESAİYE BAŞLIYOR: "rooms" klasöründeki tüm mesajları dinliyoruz
db.ref("rooms").on("child_added", (roomSnapshot) => {
    const roomName = roomSnapshot.key;
    
    // Odaların içindeki yeni mesajları dinle
    db.ref(`rooms/${roomName}`).on("child_added", (messageSnapshot) => {
        const messageData = messageSnapshot.val();
        
        // Sadece son 1 dakika içinde gelen YENİ mesajları yakala (Geçmişteki mesajları boşver)
        if (Date.now() - messageData.timestamp < 60000) { 
            console.log(`Yeni Mesaj Yakalandı! Gönderen: ${messageData.sender}, Oda: ${roomName}`);
            
            // Veritabanındaki tüm kullanıcıları bul
            db.ref("users").once("value", (usersSnapshot) => {
                const users = usersSnapshot.val();
                
                for (let user in users) {
                    // Mesajı atan kişiye kendi mesajının bildirimini atma ve "fcmToken" (bildirim izni) olanlara at
                    if (user !== messageData.sender && users[user].fcmToken) {
                        
                        // Tarayıcıya gidecek bildirimin paketini hazırlıyoruz
                        const payload = {
                            notification: {
                                title: `${roomName} - Yeni Mesaj`,
                                body: `${messageData.sender}: ${messageData.text || "📷 Medya gönderdi"}`,
                                icon: "https://cdn-icons-png.flaticon.com/512/733/733585.png"
                            },
                            token: users[user].fcmToken
                        };

                        // Bildirimi fırlat!
                        admin.messaging().send(payload)
                            .then((response) => console.log(`${user} adlı kullanıcıya bildirim gitti!`))
                            .catch((error) => console.log(`Bildirim hatası:`, error));
                    }
                }
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Bekçi ${port} portunda nöbete başladı... Gözler veritabanında!`);
});
