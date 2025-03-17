export class Rand {
    // Generate a pseudo-random number between 1 and 10 (inclusive) using "event-1-status" as seed key:
    //      random("event-1-status", 1, 10)
    static random(key: string, min: number, max: number): number {
        // FNV-1a hash to generate a 32-bit seed from the key
        let hash = 2166136261;
        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }

        // Further scramble using a simple xorshift
        hash ^= hash << 13;
        hash ^= hash >>> 17;
        hash ^= hash << 5;
        hash >>>= 0; // force unsigned 32-bit

        // Normalize to [0, 1)
        const normalized = hash / 4294967296;

        return min + Math.floor(normalized * (max - min + 1));
    }

    static sample<T>(key: string, xs: T[]): T {
        const index = Rand.random(key, 0, xs.length - 1);
        const value = xs[index];
        if (!value) throw new Error(`Cannot sample from empty list`);
        return value;
    }
}
