const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// JSON fayl bazasi yo'li
const DB_FILE = path.join(__dirname, 'rental.json');

// Agar baza fayli bo'lmasa, boshlang'ich ma'lumot bilan yaratamiz
if (!fs.existsSync(DB_FILE)) {
    const initialData = [
        { id: 1, name: 'Perforator', price_per_day: 50000 },
        { id: 2, name: 'Bolgarka', price_per_day: 35000 }
    ];
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Asboblarni olish (GET)
app.get('/api/instruments', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Maʼlumotni oʻqishda xatolik' });
    }
});

// Yangi asbob qo'shish (POST)
app.post('/api/instruments', (req, res) => {
    try {
        const { name, price_per_day } = req.body;
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        
        const newInstrument = {
            id: data.length > 0 ? data[data.length - 1].id + 1 : 1,
            name: name,
            price_per_day: Number(price_per_day)
        };
        
        data.push(newInstrument);
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, instrument: newInstrument });
    } catch (err) {
        res.status(500).json({ error: 'Saqlashda xatolik' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server ishga tushdi: port ${PORT}`);
});
