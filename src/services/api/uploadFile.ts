import {
  FileSystemUploadType,
  getInfoAsync,
  uploadAsync,
} from 'expo-file-system/legacy';

import { logger } from '@utils/logger';

/**
 * The canned ACL the server signs the upload URL with.
 *
 * The presigned URL's `X-Amz-SignedHeaders` list includes `x-amz-acl`, which
 * means the signature covers that header — so the PUT has to send it, byte for
 * byte, or the storage provider rejects the request with SignatureDoesNotMatch.
 * `public-read` matches the `publicUrl` the presign response hands back.
 */
const UPLOAD_ACL = 'public-read';

/** Pull the `<Code>` out of an S3/Spaces XML error so failures are readable. */
const storageErrorCode = (body: string): string | null => {
  const match = /<Code>([^<]+)<\/Code>/.exec(body);
  return match?.[1] ?? null;
};

/**
 * PUT a local file straight to presigned storage.
 *
 * Two things here are deliberate and easy to get wrong:
 *
 * 1. It does not use the shared `api` axios instance. That one attaches a
 *    Bearer token and prepends our base URL — both wrong for an absolute
 *    presigned URL, and an unsigned Authorization header can void the
 *    signature outright.
 *
 * 2. It uses `uploadAsync` rather than `fetch(uri).blob()` + axios. Turning a
 *    `file://` URI into a Blob is unreliable in React Native — the request
 *    frequently goes out empty or with a rewritten content type, which
 *    storage answers with a signature mismatch. `uploadAsync` streams the file
 *    from disk natively and sends exactly the headers given.
 */
export const putFileToSignedUrl = async (
  uploadUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> => {
  // Proves which bytes left the device. A size that doesn't change between two
  // different pictures means we sent the same file twice; a size of 0 means we
  // sent nothing. Either way it separates "wrong file uploaded" from "wrong
  // file served back".
  const info = await getInfoAsync(fileUri);
  logger.info('Uploading file', {
    fileUri,
    bytes: info.exists ? info.size : 'missing',
    contentType,
  });

  const result = await uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'PUT',
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Content-Type': contentType,
      'x-amz-acl': UPLOAD_ACL,
    },
  });

  // uploadAsync resolves on any status, so a 4xx has to be caught by hand.
  if (result.status < 200 || result.status >= 300) {
    const code = storageErrorCode(result.body ?? '');
    logger.warn('Storage upload rejected', {
      status: result.status,
      code,
      body: result.body?.slice(0, 300),
    });
    throw new Error(
      code
        ? `Upload failed (${code}). Please try again.`
        : 'Upload failed. Please try again.',
    );
  }

  logger.info('File uploaded to storage');
};

/**
 * Best-effort MIME type from a file name.
 *
 * Whatever this returns is sent to the presign endpoint AND used as the PUT's
 * Content-Type — the signature covers that header, so the two must agree.
 */
export const contentTypeFor = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
};

/** Filename from a local URI, falling back to a generated one. */
export const fileNameFor = (uri: string): string => {
  // Strip any query string first — picker URIs sometimes carry one.
  const path = uri.split('?')[0] ?? uri;
  const last = path.split('/').pop();
  return last && last.includes('.') ? last : `upload-${Date.now()}.jpg`;
};
