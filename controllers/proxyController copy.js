import fs from 'fs/promises';
import path from 'path';
import { createExtractorFromFile } from 'node-unrar-js';

function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

async function extractRarArchive(file, destination) {
  return new Promise(async (resolve, _reject) => {
    try {
      // Create the extractor with the file information (returns a promise)
      const extractor = await createExtractorFromFile({
        filepath: file,
        targetPath: destination
      });
  
      // Extract the files
      [...extractor.extract().files];

      resolve(true);
    } catch (err) {
      // May throw UnrarError, see docs
      console.error(err);
      resolve(false);
    }

  });
}

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

    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }

    if (fileUrl.toLowerCase().endsWith('.rar') || contentType.includes('application/x-rar-compressed')) {
      try {
        // Save .rar file to temp folder
        await fs.mkdir(path.join(process.cwd(), 'temp'), { recursive: true });
        tempRarPath = path.join(process.cwd(), `temp/temp-rar-${Date.now()}.rar`);
        await fs.writeFile(tempRarPath, Buffer.from(arrayBuffer));

        // Create extractor to list files
        const extractor = await createExtractorFromFile({
          filepath: tempRarPath,
        });

        const list = extractor.getFileList();

        let fileHeaders = [];
        if (list && list.fileHeaders) {
          if (Symbol.iterator in list.fileHeaders) {
            fileHeaders = [...list.fileHeaders];
          } else {
            fileHeaders = list.fileHeaders;
          }
        }

        if (!fileHeaders || !Array.isArray(fileHeaders) || !fileHeaders.length) {
          throw new Error('Invalid RAR file: No files found or file list is empty');
        }

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
        tempOutputDir = path.join(process.cwd(), `temp/extracted-${Date.now()}`);
        await fs.mkdir(tempOutputDir, { recursive: true });

        try {
          // Create parent directory for target file
          const filePath = path.join(tempOutputDir, targetFile.name);
          const parentDir = path.dirname(filePath);
          await fs.mkdir(parentDir, { recursive: true });

          // Extract the target file
          await extractRarArchive(tempRarPath, tempOutputDir);

          // Check for extracted file
          let extractedFilePath = path.join(tempOutputDir, targetFile.name);
          let fileFound = await fs.access(extractedFilePath).then(() => true).catch(() => false);

          if (!fileFound) {
            const baseName = path.basename(targetFile.name);
            extractedFilePath = path.join(tempOutputDir, baseName);
            fileFound = await fs.access(extractedFilePath).then(() => true).catch(() => false);
          }

          if (!fileFound) {
            const sanitizedName = path.basename(targetFile.name).replace(/[\s()]/g, '_');
            extractedFilePath = path.join(tempOutputDir, sanitizedName);
            fileFound = await fs.access(extractedFilePath).then(() => true).catch(() => false);
          }

          if (!fileFound) {
            throw new Error(`File not found after extraction: ${targetFile.name}`);
          }

          // Read Excel file
          const extractedData = await fs.readFile(extractedFilePath);
          const xlsxFiles = [{
            name: targetFile.name,
            data: bufferToBase64(extractedData),
          }];

          return res.json({
            type: 'rar',
            files: xlsxFiles,
          });
        } finally {
          // Comment để debug
          if (tempOutputDir && (await fs.access(tempOutputDir).then(() => true).catch(() => false))) {
            await fs.rm(tempOutputDir, { recursive: true, force: true });
          }
          if (tempRarPath && (await fs.access(tempRarPath).then(() => true).catch(() => false))) {
            await fs.rm(tempRarPath, { force: true });
          }
        }
      } catch (rarError) {
        console.error('RAR extraction error:', rarError.message, rarError.stack);
        return res.status(500).json({ error: `Failed to extract RAR file: ${rarError.message}` });
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
    if (tempOutputDir && (await fs.access(tempOutputDir).then(() => true).catch(() => false))) {
      await fs.rm(tempOutputDir, { recursive: true, force: true });
      console.log('Temporary output directory deleted in outer finally block:', tempOutputDir);
    }
    if (tempRarPath && (await fs.access(tempRarPath).then(() => true).catch(() => false))) {
      await fs.rm(tempRarPath, { force: true });
      console.log('Temporary RAR file deleted in outer finally block:', tempRarPath);
    }
  }
};