const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const users = {}; // email -> {password, balance, history[]}
const SECRET = "matrix_secret";

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("No token");
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded.email;
    next();
  } catch (e) {
    res.status(401).send("Invalid token");
  }
}

app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (users[email]) return res.json({ message: 'Email đã tồn tại' });
  users[email] = { password, balance: 20000, history: [] };
  res.json({ message: 'Đăng ký thành công' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!users[email] || users[email].password !== password)
    return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
  const token = jwt.sign({ email }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

app.post('/api/generate', auth, async (req, res) => {
  const email = req.user;
  const prompt = req.body.prompt;
  const user = users[email];
  if (user.balance < 10000)
    return res.json({ html: '<p>Số dư không đủ để tạo đề.</p>', balance: user.balance });

  try {
    const result = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const html = result.data.choices[0].message.content;
    user.balance -= 10000;
    user.history.push(prompt);
    res.json({ html, balance: user.balance });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ html: '<p>Lỗi GPT</p>', balance: user.balance });
  }
});

app.get('/api/history', auth, (req, res) => {
  const email = req.user;
  res.json({ history: users[email].history });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
