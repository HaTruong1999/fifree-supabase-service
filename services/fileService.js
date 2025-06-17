import fs from 'fs/promises';
import path from 'path';
import { createExtractorFromFile } from 'node-unrar-js';

function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

async function listDirRecursive(dir) {
  try {
    const files = await fs.readdir(dir, { recursive: true, withFileTypes: true });
    return files.map(item => ({
      name: item.name,
      path: path.join(item.path, item.name),
      isFile: item.isFile(),
      isDirectory: item.isDirectory(),
    }));
  } catch (error) {
    return [];
  }
}

async function saveRarFile(arrayBuffer) {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempRarPath = path.join(tempDir, `temp-rar-${Date.now()}.rar`);
    await fs.writeFile(tempRarPath, Buffer.from(arrayBuffer));
    return tempRarPath;
  } catch (error) {
    throw new Error(`Failed to save RAR file: ${error.message}`);
  }
}

async function listRarFiles(rarPath) {
  try {
    const extractor = await createExtractorFromFile({ filepath: rarPath });
    const list = extractor.getFileList();
    let fileHeaders = [];
    if (list && list.fileHeaders) {
      fileHeaders = Symbol.iterator in list.fileHeaders ? [...list.fileHeaders] : list.fileHeaders;
    }
    if (!fileHeaders || !Array.isArray(fileHeaders) || !fileHeaders.length) {
      throw new Error('Invalid RAR file: No files found or file list is empty');
    }
    return fileHeaders;
  } catch (error) {
    throw new Error(`Failed to list RAR files: ${error.message}`);
  }
}

async function extractRarArchive(file, destination) {
  return new Promise(async (resolve, _reject) => {
    try {
      const extractor = await createExtractorFromFile({
        filepath: file,
        targetPath: destination
      });
      [...extractor.extract().files];
      resolve(true);
    } catch (err) {
      resolve(false);
    }
  });
}

async function readExtractedFile(tempOutputDir, targetFileName) {
  try {
    let extractedFilePath = path.join(tempOutputDir, targetFileName);
    let fileFound = await fs.access(extractedFilePath).then(() => true).catch(() => false);

    if (!fileFound) {
      const baseName = path.basename(targetFileName);
      extractedFilePath = path.join(tempOutputDir, baseName);
      fileFound = await fs.access(extractedFilePath).then(() => true).catch(() => false);
    }

    if (!fileFound) {
      const sanitizedName = path.basename(targetFileName).replace(/[\s()]/g, '_');
      extractedFilePath = path.join(tempOutputDir, sanitizedName);
      fileFound = await fs.access(extractedFilePath).then(() => true).catch(() => false);
    }

    if (!fileFound) {
      const filesInDir = await listDirRecursive(tempOutputDir);
      throw new Error(`File not found after extraction: ${targetFileName}`);
    }

    const extractedData = await fs.readFile(extractedFilePath);
    return {
      name: targetFileName,
      data: bufferToBase64(extractedData),
    };
  } catch (error) {
    throw new Error(`Failed to read extracted file: ${error.message}`);
  }
}

async function cleanupTempFiles(tempOutputDir, tempRarPath) {
  try {
    if (tempOutputDir && (await fs.access(tempOutputDir).then(() => true).catch(() => false))) {
      await fs.rm(tempOutputDir, { recursive: true, force: true });
    }
    if (tempRarPath && (await fs.access(tempRarPath).then(() => true).catch(() => false))) {
      await fs.rm(tempRarPath, { force: true });
    }
  } catch (error) {
    throw new Error(`Failed to clean up temp files: ${error.message}`);
  }
}

export {
  bufferToBase64,
  listDirRecursive,
  saveRarFile,
  listRarFiles,
  extractRarArchive,
  readExtractedFile,
  cleanupTempFiles,
};