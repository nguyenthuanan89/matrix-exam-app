const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/generate-matrix', async (req, res) => {
  const { subject, numQuestions, difficulty } = req.body;

  const prompt = `Tạo một ma trận đề thi cho môn ${subject}, gồm ${numQuestions} câu hỏi với mức độ khó: ${difficulty}. Trả về dưới dạng bảng HTML.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const htmlMatrix = response.data.choices[0].message.content;
    res.json({ html: htmlMatrix });
  } catch (error) {
    console.error('Lỗi gọi OpenAI:', error.response?.data || error.message);
    res.status(500).json({ error: 'Không thể tạo ma trận đề thi.' });
  }
});

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
