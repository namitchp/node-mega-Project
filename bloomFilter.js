import crypto from 'crypto';

class BloomFilter {
  constructor(size = 100, hashCount = 3) {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Array(size).fill(false);
  }

  _hash(value, seed) {
    const hash = crypto.createHash('sha256');
    hash.update(value + seed);
    return parseInt(hash.digest('hex'), 16) % this.size;
  }

  add(value) {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this._hash(value, i);
      this.bitArray[index] = true;
    }
  }

  contains(value) {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this._hash(value, i);
      if (!this.bitArray[index]) {
        return false;
      }
    }
    return true;
  }
}

export default BloomFilter;
