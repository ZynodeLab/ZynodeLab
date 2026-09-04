const HEX = /^[0-9a-f]+$/i;

export function concatBytes(chunks) {
  if (!Array.isArray(chunks)) throw new TypeError('concatBytes expects an array of Uint8Array values.');
  let total = 0;
  for (const chunk of chunks) {
    if (!(chunk instanceof Uint8Array)) throw new TypeError('concatBytes only accepts Uint8Array values.');
    total += chunk.length;
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

export function bytesToHex(bytes, separator = '') {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('bytesToHex expects a Uint8Array.');
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(separator);
}

export function hexToBytes(value) {
  if (typeof value !== 'string') throw new TypeError('hexToBytes expects a string.');
  const normalized = value.trim().replace(/^0x/i, '').replace(/\s+/g, '');
  if (normalized.length % 2 !== 0) throw new Error('Hex input must contain an even number of characters.');
  if (normalized.length > 0 && !HEX.test(normalized)) throw new Error('Hex input contains invalid characters.');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export function equalBytes(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array)) return false;
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export function firstByteDifference(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array)) {
    throw new TypeError('firstByteDifference expects Uint8Array values.');
  }
  const limit = Math.min(left.length, right.length);
  for (let index = 0; index < limit; index += 1) {
    if (left[index] !== right[index]) {
      return { index, left: left[index], right: right[index] };
    }
  }
  if (left.length !== right.length) {
    return {
      index: limit,
      left: left.length > limit ? left[limit] : null,
      right: right.length > limit ? right[limit] : null,
    };
  }
  return null;
}

export function boundariesFor(chunks) {
  const boundaries = [];
  let offset = 0;
  for (const chunk of chunks) {
    offset += chunk.length;
    boundaries.push(offset);
  }
  return boundaries;
}
