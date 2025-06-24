
import { UploadedFile } from '../types';

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const processFileForUpload = async (file: File): Promise<UploadedFile> => {
  const base64 = await readFileAsDataURL(file);
  return {
    file,
    previewUrl: URL.createObjectURL(file),
    base64: base64.split(',')[1], // Remove the "data:mime/type;base64," prefix
    mimeType: file.type,
  };
};

export const processMultipleFilesForUpload = async (files: FileList): Promise<UploadedFile[]> => {
  const processedFiles: UploadedFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file) {
      processedFiles.push(await processFileForUpload(file));
    }
  }
  return processedFiles;
};