import xlsx from 'xlsx';

/**
 * Trích xuất nội dung từ sheet có chứa từ khóa, chuyển sang dạng bảng văn bản (text table)
 * để truyền cho AI model xử lý.
 * 
 * @param {Buffer} excelBuffer - buffer của file Excel (.xlsx hoặc .xls)
 * @param {string} sheetKeyword - từ khóa tên sheet (mặc định: "DanhMuc")
 * @returns {string} nội dung bảng dạng text
 */
export const parseExcelToText = async (excelBuffer, sheetKeyword = 'DanhMuc') => {
  try {
    const workbook = xlsx.read(excelBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.find(name =>
      name.toLowerCase().includes(sheetKeyword.toLowerCase())
    );

    if (!sheetName) throw new Error(`Không tìm thấy sheet chứa từ khóa "${sheetKeyword}"`);

    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });

    if (!Array.isArray(json) || json.length === 0) {
      throw new Error('Sheet không có dữ liệu hoặc không thể parse thành JSON');
    }

    // Chuyển sang bảng dạng text
    const keys = Object.keys(json[0]);
    let tableText = keys.join('\t') + '\n';

    for (const row of json) {
      tableText += keys.map(key => row[key]).join('\t') + '\n';
    }

    return tableText.trim();
  } catch (err) {
    console.error('[parseExcelToText]', err);
    throw new Error('Không thể đọc nội dung Excel: ' + err.message);
  }
};
