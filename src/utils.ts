/**
 * Converts an integer to its two's complement binary representation.
 * @param num The integer to convert.
 * @param width The desired bit width for the output string.
 * @returns The two's complement binary string.
 */
function toTwosComplement(num: number, width: number): string {
    // If the number is non-negative, it's a standard binary conversion.
    if (num >= 0) {
        const binary = num.toString(2);
        return binary.padStart(width, '0');
    }

    // If the number is negative, calculate the two's complement.
    // Step 1: Get the binary representation of the absolute value.
    const absBinary = Math.abs(num).toString(2);
    const paddedAbsBinary = absBinary.padStart(width, '0');

    // Step 2: Invert the bits (one's complement).
    let onesComplement = '';
    for (let i = 0; i < paddedAbsBinary.length; i++) {
        onesComplement += paddedAbsBinary[i] === '0' ? '1' : '0';
    }

    // Step 3: Add 1 to the one's complement.
    let carry = 1;
    let twosComplement = '';
    for (let i = onesComplement.length - 1; i >= 0; i--) {
        const bit = parseInt(onesComplement[i]);
        const sum = bit + carry;
        twosComplement = (sum % 2) + twosComplement;
        carry = Math.floor(sum / 2);
    }

    return twosComplement;
}