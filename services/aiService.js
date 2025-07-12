import axios from 'axios';

export const callAiModel = async (tableText) => {
  const prompt = `
Phân tích bảng dữ liệu dưới đây từ file Excel và trả về mảng JSON gồm các trường:
index, stock_code, macode, quantity, market_price, value, portfolio_rate

Dữ liệu:
${tableText}
`.trim();

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1:free', // model free
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Không có nội dung trả về từ AI');

    // Nếu nhận raw text có thêm tiền tố, lọc JSON
    const jsonMatch = content.match(/\[.*\]/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);

    return JSON.parse(content);
  } catch (err) {
    console.error('[callAiModel]', err.response?.data || err.message);
    throw new Error(err.response?.data?.error?.message || 'Gọi AI model thất bại');
  }
};
