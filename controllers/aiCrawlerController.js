import { extractExcelBuffer } from '../services/fileService.js';
import { parseExcelToText } from '../services/excelParser.js';
import { callAiModel } from '../services/aiService.js';

export const handleAiCrawl = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing "url" in body' });

  try {
    const excelBuffer = await extractExcelBuffer(url); // đọc file .rar hoặc excel thường
    const extractedText = await parseExcelToText(excelBuffer, 'DanhMucDauTu'); // sheet name
    const result = await callAiModel(extractedText); // Gọi OpenRouter hoặc model AI
    res.json({ data: result });
  } catch (err) {
    console.error('[handleAiCrawl]', err.message);
    res.status(500).json({ error: err.message });
  }
};
