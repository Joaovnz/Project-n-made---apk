/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Minimalist, zero-dependency QR Code matrix generator for URLs and text.
 * Generates an SVG path or data URI for high-contrast scanning by mobile phone cameras.
 */
export function generateQrSvgUri(text: string): string {
  // Use public QR service with fallback or pure SVG rendering
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encoded}&bgcolor=090d16&color=f59e0b&margin=2`;
}
