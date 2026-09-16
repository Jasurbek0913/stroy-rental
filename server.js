const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 5000;

// POST so'rovlaridan keladigan JSON ma'lumotlarni o'qish uchun
app.use(express.json());

// Bazaga ulanish
const db = new sqlite3.Database('./rental.db', (err) => {
    if (err) {
        console.error("Bazaga ulanishda xatolik:", err.message);
    } else {
        console.log("SQLite bazasiga muvaffaqiyatli ulandi.");
    }
});

// Asboblar jadvalini yaratish
db.run(`CREATE TABLE IF NOT EXISTS instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price_per_day INTEGER NOT NULL
)`);

// 1. API: Barcha asboblarni olish
app.get('/api/instruments', (req, res) => {
    db.all("SELECT * FROM instruments", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 2. API: Yangi asbob qo'shish
app.post('/api/instruments', (req, res) => {
    const { name, price_per_day } = req.body;
    if (!name || !price_per_day) {
        return res.status(400).json({ error: "Nom va narx kiritilishi shart!" });
    }
    
    const query = `INSERT INTO instruments (name, price_per_day) VALUES (?, ?)`;
    db.run(query, [name, price_per_day], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, price_per_day });
    });
});

// Asosiy sahifa (HTML + CSS + Forma va JavaScript)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="uz">
        <head>
            <meta charset="UTF-8">
            <title>Stroy Instrument Ijara</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px; max-width: 600px; margin: auto; }
                h1, h2 { text-align: center; color: #333; }
                .card { background: #fff; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
                .btn { background-color: #2ea6ff; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; }
                .btn:hover { background-color: #1a8ad6; }
                .form-box { background: #fff; padding: 15px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
            </style>
        </head>
        <body>
            <h1>🛠️ Qurilish Asboblari Ijarasi</h1>
            
            <!-- Yangi asbob qo'shish formasi -->
            <div class="form-box">
                <h2>Yangi asbob qo'shish</h2>
                <input type="text" id="name" placeholder="Asbob nomi (masalan: Drel)">
                <input type="number" id="price" placeholder="Kunlik narxi (so'm)">
                <button class="btn" onclick="addInstrument()" style="width: 100%;">Qo'shish</button>
            </div>

            <h2>Mavjud asboblar</h2>
            <div id="list"><p style="text-align: center;">Yuklanmoqda...</p></div>

            <script>
                function loadInstruments() {
                    fetch('http://localhost:5000/api/instruments')
                        .then(res => res.json())
                        .then(data => {
                            const box = document.getElementById('list');
                            box.innerHTML = '';
                            if(data.length === 0) {
                                box.innerHTML = '<p style="text-align: center;">Asboblar yo\\'q</p>';
                                return;
                            }
                            data.forEach(item => {
                                box.innerHTML += '<div class="card"><div><h3>' + item.name + '</h3><p>Narxi: ' + item.price_per_day + ' so\\'m / kun</p></div><button class="btn" onclick="alert(\\'Tanlandi: ' + item.name + '\\')">Oling</button></div>';
                            });
                        })
                        .catch(err => {
                            document.getElementById('list').innerHTML = '<p style="text-align: center; color: red;">Xatolik yuz berdi!</p>';
                        });
                }

                function addInstrument() {
                    const name = document.getElementById('name').value;
                    const price_per_day = document.getElementById('price').value;

                    if(!name || !price_per_day) {
                        alert('Iltimos, barcha maydonlarni to\\'ldiring!');
                        return;
                    }

                    fetch('http://localhost:5000/api/instruments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name, price_per_day: Number(price_per_day) })
                    })
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('name').value = '';
                        document.getElementById('price').value = '';
                        loadInstruments(); // Ro'yxatni yangilash
                    })
                    .catch(err => alert('Xatolik yuz berdi!'));
                }

                // Sahifa ochilganda asboblarni yuklash
                loadInstruments();
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server ishga tushdi: http://localhost:${PORT}`);
});