export function buildTableQrCodeValue(tableCode: string): string {
  const normalizedTableCode = tableCode
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');

  if (!normalizedTableCode) {
    throw new Error('tableCode is required to generate qrCodeValue');
  }

  return `TABLE-${normalizedTableCode}`;
}

const QR_EC_LEVEL_BITS = 0b01;
const QR_FORMAT_MASK = 0x5412;
const QR_FORMAT_GENERATOR = 0x537;

type QrVersionConfig = {
  version: 1 | 2;
  size: number;
  dataCodewords: number;
  eccCodewords: number;
  maxByteLength: number;
  alignmentCenters: number[];
};

type QrTemplate = {
  matrix: (boolean | null)[][];
  reserved: boolean[][];
};

const QR_VERSIONS: QrVersionConfig[] = [
  {
    version: 1,
    size: 21,
    dataCodewords: 19,
    eccCodewords: 7,
    maxByteLength: 17,
    alignmentCenters: [],
  },
  {
    version: 2,
    size: 25,
    dataCodewords: 34,
    eccCodewords: 10,
    maxByteLength: 32,
    alignmentCenters: [18],
  },
];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
let galoisReady = false;

export function buildTableQrSvg(qrCodeValue: string): string {
  const matrix = buildQrMatrix(qrCodeValue);
  const moduleSize = 8;
  const quietZone = 4;
  const size = matrix.length;
  const totalSize = (size + quietZone * 2) * moduleSize;

  const rects: string[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!matrix[row][col]) {
        continue;
      }
      rects.push(
        `<rect x="${(col + quietZone) * moduleSize}" y="${(row + quietZone) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#000000"/>`,
      );
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}" shape-rendering="crispEdges">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<title>${escapeXml(qrCodeValue)}</title>`,
    ...rects,
    `</svg>`,
  ].join('');
}

function buildQrMatrix(qrCodeValue: string): boolean[][] {
  ensureGaloisField();

  const bytes = Buffer.from(qrCodeValue, 'utf8');
  const config = pickVersion(bytes.length);
  if (bytes.length > config.maxByteLength) {
    throw new Error(`qrCodeValue is too long for QR version ${config.version}`);
  }

  const dataCodewords = encodeDataCodewords(bytes, config.dataCodewords);
  const eccCodewords = encodeEccCodewords(dataCodewords, config.eccCodewords);
  const codewords = [...dataCodewords, ...eccCodewords];
  const bits = codewordsToBits(codewords);

  let bestMatrix: boolean[][] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let maskPattern = 0; maskPattern < 8; maskPattern += 1) {
    const candidate = createTemplate(config);
    placeDataBits(candidate.matrix, candidate.reserved, bits, maskPattern);
    setFormatBits(candidate.matrix, maskPattern, config.size);

    const score = calculatePenalty(candidate.matrix);
    if (score < bestScore) {
      bestScore = score;
      bestMatrix = candidate.matrix.map((row) =>
        row.map((cell) => cell === true),
      );
    }
  }

  if (!bestMatrix) {
    throw new Error('Failed to generate QR matrix');
  }

  return bestMatrix;
}

function pickVersion(byteLength: number): QrVersionConfig {
  const config = QR_VERSIONS.find((item) => byteLength <= item.maxByteLength);
  if (!config) {
    throw new Error('tableCode is too long to generate a QR code');
  }
  return config;
}

function encodeDataCodewords(bytes: Buffer, dataCodewords: number): number[] {
  const bits: number[] = [];
  pushBits(bits, 0b0100, 4);
  pushBits(bits, bytes.length, 8);

  for (const byte of bytes) {
    pushBits(bits, byte, 8);
  }

  const capacityBits = dataCodewords * 8;
  if (bits.length > capacityBits) {
    throw new Error('qrCodeValue does not fit in the selected QR version');
  }

  const terminatorBits = Math.min(4, capacityBits - bits.length);
  pushBits(bits, 0, terminatorBits);

  while (bits.length % 8 !== 0) {
    pushBits(bits, 0, 1);
  }

  const codewords = bitsToCodewords(bits);
  let padToggle = true;
  while (codewords.length < dataCodewords) {
    codewords.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  return codewords;
}

function encodeEccCodewords(
  dataCodewords: number[],
  eccCodewords: number,
): number[] {
  const generator = buildGeneratorPolynomial(eccCodewords);
  const message: number[] = [
    ...dataCodewords,
    ...Array<number>(eccCodewords).fill(0),
  ];

  for (let i = 0; i < dataCodewords.length; i += 1) {
    const factor = message[i];
    if (factor === 0) {
      continue;
    }

    for (let j = 0; j < generator.length; j += 1) {
      message[i + j] ^= gfMul(factor, generator[j]);
    }
  }

  return message.slice(dataCodewords.length);
}

function buildGeneratorPolynomial(degree: number): number[] {
  let generator = [1];

  for (let i = 0; i < degree; i += 1) {
    generator = multiplyPolynomials(generator, [1, GF_EXP[i]]);
  }

  return generator;
}

function multiplyPolynomials(left: number[], right: number[]): number[] {
  const result: number[] = Array<number>(left.length + right.length - 1).fill(
    0,
  );

  for (let i = 0; i < left.length; i += 1) {
    for (let j = 0; j < right.length; j += 1) {
      result[i + j] ^= gfMul(left[i], right[j]);
    }
  }

  return result;
}

function createTemplate(config: QrVersionConfig): QrTemplate {
  const matrix = createEmptyMatrix(config.size);
  const reserved = createEmptyBooleanMatrix(config.size);

  drawFinderPattern(matrix, reserved, 0, 0);
  drawFinderPattern(matrix, reserved, 0, config.size - 7);
  drawFinderPattern(matrix, reserved, config.size - 7, 0);
  drawTimingPatterns(matrix, reserved, config.size);

  for (const center of config.alignmentCenters) {
    drawAlignmentPattern(matrix, reserved, center, center);
  }

  drawDarkModule(matrix, reserved, config.version);
  reserveFormatAreas(reserved, config.size);

  return { matrix, reserved };
}

function drawFinderPattern(
  matrix: (boolean | null)[][],
  reserved: boolean[][],
  top: number,
  left: number,
): void {
  for (let row = -1; row <= 7; row += 1) {
    for (let col = -1; col <= 7; col += 1) {
      const actualRow = top + row;
      const actualCol = left + col;
      if (
        actualRow < 0 ||
        actualRow >= matrix.length ||
        actualCol < 0 ||
        actualCol >= matrix.length
      ) {
        continue;
      }

      reserved[actualRow][actualCol] = true;
      if (row === -1 || row === 7 || col === -1 || col === 7) {
        matrix[actualRow][actualCol] = false;
        continue;
      }

      const isBorder = row === 0 || row === 6 || col === 0 || col === 6;
      const isCenter = row >= 2 && row <= 4 && col >= 2 && col <= 4;
      matrix[actualRow][actualCol] = isBorder || isCenter;
    }
  }
}

function drawAlignmentPattern(
  matrix: (boolean | null)[][],
  reserved: boolean[][],
  centerRow: number,
  centerCol: number,
): void {
  for (let row = -2; row <= 2; row += 1) {
    for (let col = -2; col <= 2; col += 1) {
      const actualRow = centerRow + row;
      const actualCol = centerCol + col;
      if (
        actualRow < 0 ||
        actualRow >= matrix.length ||
        actualCol < 0 ||
        actualCol >= matrix.length
      ) {
        continue;
      }

      reserved[actualRow][actualCol] = true;
      const distance = Math.max(Math.abs(row), Math.abs(col));
      matrix[actualRow][actualCol] = distance === 0 || distance === 2;
    }
  }
}

function drawTimingPatterns(
  matrix: (boolean | null)[][],
  reserved: boolean[][],
  size: number,
): void {
  for (let col = 8; col < size - 8; col += 1) {
    reserved[6][col] = true;
    matrix[6][col] = col % 2 === 0;
  }

  for (let row = 8; row < size - 8; row += 1) {
    reserved[row][6] = true;
    matrix[row][6] = row % 2 === 0;
  }
}

function drawDarkModule(
  matrix: (boolean | null)[][],
  reserved: boolean[][],
  version: number,
): void {
  const row = 4 * version + 9;
  const col = 8;
  reserved[row][col] = true;
  matrix[row][col] = true;
}

function reserveFormatAreas(reserved: boolean[][], size: number): void {
  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }

  for (let i = 0; i < 8; i += 1) {
    reserved[size - 1 - i][8] = true;
  }

  for (let i = 0; i < 7; i += 1) {
    reserved[8][size - 7 + i] = true;
  }
}

function placeDataBits(
  matrix: (boolean | null)[][],
  reserved: boolean[][],
  bits: number[],
  maskPattern: number,
): void {
  const size = matrix.length;
  let bitIndex = 0;
  let upward = true;

  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) {
      col -= 1;
    }

    for (let step = 0; step < size; step += 1) {
      const row = upward ? size - 1 - step : step;
      for (let offset = 0; offset < 2; offset += 1) {
        const actualCol = col - offset;
        if (reserved[row][actualCol]) {
          continue;
        }

        const bit = bits[bitIndex] ?? 0;
        matrix[row][actualCol] = applyMask(
          bit === 1,
          maskPattern,
          row,
          actualCol,
        );
        bitIndex += 1;
      }
    }

    upward = !upward;
  }
}

function setFormatBits(
  matrix: (boolean | null)[][],
  maskPattern: number,
  size: number,
): void {
  const formatInfo = buildFormatInfoBits(maskPattern);

  for (let i = 0; i < 6; i += 1) {
    matrix[i][8] = ((formatInfo >> i) & 1) === 1;
  }
  matrix[7][8] = ((formatInfo >> 6) & 1) === 1;
  matrix[8][8] = ((formatInfo >> 7) & 1) === 1;
  matrix[8][7] = ((formatInfo >> 8) & 1) === 1;
  for (let i = 9; i < 15; i += 1) {
    matrix[14 - i][8] = ((formatInfo >> i) & 1) === 1;
  }

  for (let i = 0; i < 8; i += 1) {
    matrix[size - 1 - i][8] = ((formatInfo >> i) & 1) === 1;
  }
  for (let i = 8; i < 15; i += 1) {
    matrix[8][size - 15 + i] = ((formatInfo >> i) & 1) === 1;
  }
}

function buildFormatInfoBits(maskPattern: number): number {
  let value = ((QR_EC_LEVEL_BITS << 3) | maskPattern) << 10;

  for (let i = 14; i >= 10; i -= 1) {
    if ((value & (1 << i)) !== 0) {
      value ^= QR_FORMAT_GENERATOR << (i - 10);
    }
  }

  return (
    ((((QR_EC_LEVEL_BITS << 3) | maskPattern) << 10) | (value & 0x3ff)) ^
    QR_FORMAT_MASK
  );
}

function calculatePenalty(matrix: (boolean | null)[][]): number {
  return (
    penaltyForRuns(matrix) +
    penaltyForBlocks(matrix) +
    penaltyForFinderLikePatterns(matrix) +
    penaltyForBalance(matrix)
  );
}

function penaltyForRuns(matrix: (boolean | null)[][]): number {
  let penalty = 0;

  for (const row of matrix) {
    let runColor = row[0] === true;
    let runLength = 1;
    for (let col = 1; col < row.length; col += 1) {
      if ((row[col] === true) === runColor) {
        runLength += 1;
        continue;
      }

      if (runLength >= 5) {
        penalty += 3 + (runLength - 5);
      }
      runColor = row[col] === true;
      runLength = 1;
    }
    if (runLength >= 5) {
      penalty += 3 + (runLength - 5);
    }
  }

  for (let col = 0; col < matrix.length; col += 1) {
    let runColor = matrix[0][col] === true;
    let runLength = 1;
    for (let row = 1; row < matrix.length; row += 1) {
      if ((matrix[row][col] === true) === runColor) {
        runLength += 1;
        continue;
      }

      if (runLength >= 5) {
        penalty += 3 + (runLength - 5);
      }
      runColor = matrix[row][col] === true;
      runLength = 1;
    }
    if (runLength >= 5) {
      penalty += 3 + (runLength - 5);
    }
  }

  return penalty;
}

function penaltyForBlocks(matrix: (boolean | null)[][]): number {
  let penalty = 0;

  for (let row = 0; row < matrix.length - 1; row += 1) {
    for (let col = 0; col < matrix.length - 1; col += 1) {
      const color = matrix[row][col] === true;
      if (
        (matrix[row][col + 1] === true) === color &&
        (matrix[row + 1][col] === true) === color &&
        (matrix[row + 1][col + 1] === true) === color
      ) {
        penalty += 3;
      }
    }
  }

  return penalty;
}

function penaltyForFinderLikePatterns(matrix: (boolean | null)[][]): number {
  const pattern = [
    true,
    false,
    true,
    true,
    true,
    false,
    true,
    false,
    false,
    false,
    false,
  ];
  const reversed = [...pattern].reverse();
  let penalty = 0;

  for (const row of matrix) {
    for (let col = 0; col <= row.length - pattern.length; col += 1) {
      if (
        matchesPattern(row, col, pattern) ||
        matchesPattern(row, col, reversed)
      ) {
        penalty += 40;
      }
    }
  }

  for (let col = 0; col < matrix.length; col += 1) {
    const column = matrix.map((row) => row[col] === true);
    for (let row = 0; row <= column.length - pattern.length; row += 1) {
      if (
        matchesPattern(column, row, pattern) ||
        matchesPattern(column, row, reversed)
      ) {
        penalty += 40;
      }
    }
  }

  return penalty;
}

function penaltyForBalance(matrix: (boolean | null)[][]): number {
  let darkCount = 0;
  let totalCount = 0;

  for (const row of matrix) {
    for (const cell of row) {
      totalCount += 1;
      if (cell === true) {
        darkCount += 1;
      }
    }
  }

  const darkPercent = (darkCount * 100) / totalCount;
  const deviation = Math.abs(darkPercent - 50);
  return Math.floor(deviation / 5) * 10;
}

function matchesPattern(
  line: (boolean | null)[],
  startIndex: number,
  pattern: boolean[],
): boolean {
  for (let i = 0; i < pattern.length; i += 1) {
    if ((line[startIndex + i] === true) !== pattern[i]) {
      return false;
    }
  }
  return true;
}

function applyMask(
  bit: boolean,
  maskPattern: number,
  row: number,
  col: number,
): boolean {
  const shouldInvert = getMaskCondition(maskPattern, row, col);
  return shouldInvert ? !bit : bit;
}

function getMaskCondition(
  maskPattern: number,
  row: number,
  col: number,
): boolean {
  switch (maskPattern) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    case 7:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function codewordsToBits(codewords: number[]): number[] {
  const bits: number[] = [];
  for (const codeword of codewords) {
    pushBits(bits, codeword, 8);
  }
  return bits;
}

function bitsToCodewords(bits: number[]): number[] {
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let codeword = 0;
    for (let offset = 0; offset < 8; offset += 1) {
      codeword = (codeword << 1) | (bits[i + offset] ?? 0);
    }
    codewords.push(codeword);
  }
  return codewords;
}

function pushBits(target: number[], value: number, length: number): void {
  for (let bit = length - 1; bit >= 0; bit -= 1) {
    target.push((value >> bit) & 1);
  }
}

function ensureGaloisField(): void {
  if (galoisReady) {
    return;
  }

  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = value;
    GF_LOG[value] = i;
    value <<= 1;
    if (value & 0x100) {
      value ^= 0x11d;
    }
  }

  for (let i = 255; i < GF_EXP.length; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255];
  }

  galoisReady = true;
}

function gfMul(left: number, right: number): number {
  if (left === 0 || right === 0) {
    return 0;
  }

  return GF_EXP[GF_LOG[left] + GF_LOG[right]];
}

function createEmptyMatrix(size: number): (boolean | null)[][] {
  return Array.from({ length: size }, () =>
    new Array<boolean | null>(size).fill(null),
  );
}

function createEmptyBooleanMatrix(size: number): boolean[][] {
  return Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
