import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { UploadedFile } from 'express-fileupload';
import { unlink } from 'fs/promises';
import mime from 'mime-types';
import { ConstantsProvider } from '@/constants/constants.provider';

@Injectable()
export class UtilsProvider {
  constructor(private constants: ConstantsProvider) {}

  randomString(bytes = 10): string {
    return randomBytes(bytes).toString('hex');
  }

  isJpg(buffer: Uint8Array): boolean {
    if (!buffer || buffer.length < 3) {
      return false;
    }

    return buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  }

  isPng(buffer: Uint8Array): boolean {
    if (!buffer || buffer.length < 8) {
      return false;
    }

    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  isImage(file: UploadedFile): boolean {
    const buffer = file.data;
    return this.isJpg(buffer) || this.isPng(buffer);
  }

  saveFile = async (file: UploadedFile): Promise<string> => {
    const randomString = this.randomString();
    const fileExtension: string = mime.extension(file.mimetype) as string;
    const filename = `${randomString}.${fileExtension}`;
    const path = `${this.constants.uploadDirectory}${filename}`;
    await file.mv(path);
    return filename;
  };

  removeFile = async (filename: string): Promise<void> => {
    await unlink(`${this.constants.uploadDirectory}${filename}`);
  };
}
