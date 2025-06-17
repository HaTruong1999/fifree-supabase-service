import {
  saveRarFile,
  listRarFiles,
  extractRarArchive,
  readExtractedFile,
  cleanupTempFiles,
} from '../services/fileService.js';

export const handleProxyRequest = async (req, res) => {
  const fileUrl = req.query.url;

  if (!fileUrl) {
    return res.status(400).json({ error: 'Missing "url" query param' });
  }

  let tempOutputDir, tempRarPath;
  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return res.status(500).json({ error: `Failed to fetch file: ${response.statusText}` });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    console.log('File size:', arrayBuffer.byteLength, 'bytes');

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }

    if (fileUrl.toLowerCase().endsWith('.rar') || contentType.includes('application/x-rar-compressed')) {
      try {
        // Save .rar file
        tempRarPath = await saveRarFile(arrayBuffer);

        // List files in .rar
        const fileHeaders = await listRarFiles(tempRarPath);

        // Filter Excel files and find shortest
        const excelFiles = fileHeaders.filter(file => {
          if (!file || !file.name || file.flags.directory) return false;
          const name = file.name.toLowerCase();
          return name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm');
        });

        if (!excelFiles.length) {
          throw new Error('No Excel files found in RAR archive');
        }

        const targetFile = excelFiles.reduce((shortest, file) => 
          !shortest || file.name.length < shortest.name.length ? file : shortest
        );

        // Create output directory
        tempOutputDir = `${process.cwd()}/temp/extracted-${Date.now()}`;

        // Extract target file
        await extractRarArchive(tempRarPath, tempOutputDir, targetFile.name);

        // Read extracted file
        const extractedFile = await readExtractedFile(tempOutputDir, targetFile.name);

        return res.json({
          type: 'rar',
          files: [extractedFile],
        });
      } catch (rarError) {
        console.error('RAR extraction error:', rarError.message, rarError.stack);
        return res.status(500).json({ error: `Failed to extract RAR file: ${rarError.message}` });
      } finally {
        // Comment để debug
        await cleanupTempFiles(tempOutputDir, tempRarPath);
      }
    }

    if (
      contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      contentType.includes('application/vnd.ms-excel') ||
      fileUrl.toLowerCase().endsWith('.xlsx') ||
      fileUrl.toLowerCase().endsWith('.xls') ||
      fileUrl.toLowerCase().endsWith('.xlsm')
    ) {
      res.set({
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `attachment; filename="${fileUrl.split('/').pop()}"`,
      });

      return res.send(Buffer.from(arrayBuffer));
    }

    return res.status(400).json({ error: 'Unsupported file type' });
  } catch (error) {
    console.error('Proxy error:', error.message, error.stack);
    return res.status(500).json({ error: 'Error processing file' });
  } finally {
    // Comment để debug
    await cleanupTempFiles(tempOutputDir, tempRarPath);
  }
};