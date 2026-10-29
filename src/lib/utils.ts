import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from './constants';

export function formatBytes(bytes?: number | null, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    // Check extension fallback in case browser didn't infer mime correctly
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    if (!ext || !validExts.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file format. Please upload PDF, JPG, JPEG, PNG, or WEBP only.`,
      };
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of 10 MB (File size: ${formatBytes(file.size)}).`,
    };
  }

  return { valid: true };
}

