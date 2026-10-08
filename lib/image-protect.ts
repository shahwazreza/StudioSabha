// Protection applied to every artwork image the site stores: a size cap (so
// copies print poorly), a faint corner watermark, and copyright info embedded
// in the file. Full-size originals are NOT stored online; the artist keeps them.
// Works in the browser and in Node (plain byte manipulation, no libraries).

export const DISPLAY_MAX_EDGE = 1400; // px, long edge of public copies
export const DISPLAY_QUALITY = 0.82;
export const WATERMARK_TEXT = "© Sabha Sumaiya";

// EXIF text must be plain ASCII, hence "Copyright" rather than the symbol.
export const EXIF_ARTIST = "Sabha Sumaiya";
export function exifCopyright(year = new Date().getFullYear()) {
  return `Copyright ${year} Sabha Sumaiya. All rights reserved. Reproduction without permission is prohibited. instagram.com/studiosabha`;
}

// Inserts an EXIF block (Artist + Copyright) right after the JPEG's start
// marker. Any existing metadata was already stripped when the image was made.
export function addCopyrightExif(jpeg: Uint8Array, artist = EXIF_ARTIST, copyright = exifCopyright()): Uint8Array {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return jpeg; // not a JPEG

  const ascii = (s: string) => {
    const bytes = new Uint8Array(s.length + 1); // NUL-terminated
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0x7f;
    return bytes;
  };
  const values = [
    { tag: 0x013b, data: ascii(artist) }, // Artist
    { tag: 0x8298, data: ascii(copyright) }, // Copyright
  ];

  // TIFF structure (little-endian): header (8) + IFD (2 + 12n + 4) + values.
  const ifdSize = 2 + values.length * 12 + 4;
  const dataStart = 8 + ifdSize;
  const tiffLength = dataStart + values.reduce((n, v) => n + v.data.length, 0);
  const tiff = new Uint8Array(tiffLength);
  const dv = new DataView(tiff.buffer);
  tiff.set([0x49, 0x49, 0x2a, 0x00]); // "II", 42
  dv.setUint32(4, 8, true); // IFD0 starts right after the header
  dv.setUint16(8, values.length, true);
  let dataOffset = dataStart;
  values.forEach((v, i) => {
    const entry = 10 + i * 12;
    dv.setUint16(entry, v.tag, true);
    dv.setUint16(entry + 2, 2, true); // type ASCII
    dv.setUint32(entry + 4, v.data.length, true);
    dv.setUint32(entry + 8, dataOffset, true); // always > 4 bytes, so stored at an offset
    tiff.set(v.data, dataOffset);
    dataOffset += v.data.length;
  });
  dv.setUint32(10 + values.length * 12, 0, true); // no next IFD

  const header = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // "Exif\0\0"
  const segmentLength = 2 + header.length + tiff.length;
  const app1 = new Uint8Array(2 + segmentLength);
  app1.set([0xff, 0xe1, segmentLength >> 8, segmentLength & 0xff]);
  app1.set(header, 4);
  app1.set(tiff, 4 + header.length);

  const out = new Uint8Array(jpeg.length + app1.length);
  out.set(jpeg.subarray(0, 2));
  out.set(app1, 2);
  out.set(jpeg.subarray(2), 2 + app1.length);
  return out;
}
