import { describe, it, expect, beforeEach } from "vitest";

interface Patent {
  title: string;
  abstract: string;
  inventor: string;
  filingDate: bigint;
  docHash: Uint8Array;
}

const mockContract = {
  admin: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  paused: false,
  nextPatentId: 1n,
  patents: new Map<bigint, Patent>(),
  hashToId: new Map<string, bigint>(), // Use string for hash key (hex or base64, but for simplicity stringified)
  inventorPatents: new Map<string, bigint[]>(),
  MAX_TITLE_LEN: 100,
  MAX_ABSTRACT_LEN: 500,
  HASH_LEN: 32,
  MAX_INVENTOR_PATENTS: 50,

  isAdmin(caller: string): boolean {
    return caller === this.admin;
  },

  setPaused(caller: string, pause: boolean): { value: boolean } | { error: number } {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    return { value: pause };
  },

  transferAdmin(caller: string, newAdmin: string): { value: boolean } | { error: number } {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (newAdmin === caller) return { error: 105 };
    this.admin = newAdmin;
    return { value: true };
  },

  registerPatent(
    caller: string,
    title: string,
    abstract: string,
    docHash: Uint8Array
  ): { value: bigint } | { error: number } {
    if (this.paused) return { error: 108 };
    if (title.length === 0) return { error: 109 };
    if (title.length > this.MAX_TITLE_LEN) return { error: 101 };
    if (abstract.length === 0) return { error: 109 };
    if (abstract.length > this.MAX_ABSTRACT_LEN) return { error: 102 };
    if (docHash.length !== this.HASH_LEN) return { error: 103 };
    const hashKey = docHash.toString(); // Simple string key for map
    if (this.hashToId.has(hashKey)) return { error: 104 };
    const currentList = this.inventorPatents.get(caller) || [];
    if (currentList.length >= this.MAX_INVENTOR_PATENTS) return { error: 106 };

    const patentId = this.nextPatentId;
    const filingDate = 100n; // Mock block height

    this.patents.set(patentId, {
      title,
      abstract,
      inventor: caller,
      filingDate,
      docHash,
    });
    this.hashToId.set(hashKey, patentId);
    this.inventorPatents.set(caller, [...currentList, patentId]);
    this.nextPatentId += 1n;

    return { value: patentId };
  },

  getPatent(patentId: bigint): { value: Patent } | { error: number } {
    const patent = this.patents.get(patentId);
    if (!patent) return { error: 107 };
    return { value: patent };
  },

  getPatentByHash(docHash: Uint8Array): { value: Patent } | { error: number } {
    const hashKey = docHash.toString();
    const id = this.hashToId.get(hashKey);
    if (!id) return { error: 103 };
    return this.getPatent(id);
  },

  getInventorPatents(inventor: string): { value: bigint[] } {
    return { value: this.inventorPatents.get(inventor) || [] };
  },

  getNextPatentId(): { value: bigint } {
    return { value: this.nextPatentId };
  },
};

describe("Decentralized Patent Registry Contract", () => {
  beforeEach(() => {
    mockContract.admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    mockContract.paused = false;
    mockContract.nextPatentId = 1n;
    mockContract.patents = new Map();
    mockContract.hashToId = new Map();
    mockContract.inventorPatents = new Map();
  });

  it("should register a new patent successfully", () => {
    const docHash = new Uint8Array(32).fill(1); // Mock hash
    const result = mockContract.registerPatent(
      "ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME",
      "Innovative Widget",
      "A description of the widget.",
      docHash
    );
    expect(result).toEqual({ value: 1n });
    expect(mockContract.patents.size).toBe(1);
    expect(mockContract.hashToId.size).toBe(1);
    expect(mockContract.inventorPatents.get("ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME")?.length).toBe(1);
  });

  it("should prevent registration with duplicate hash", () => {
    const docHash = new Uint8Array(32).fill(1);
    mockContract.registerPatent(
      "ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME",
      "Widget",
      "Desc",
      docHash
    );
    const result = mockContract.registerPatent(
      "ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME",
      "Another",
      "Desc2",
      docHash
    );
    expect(result).toEqual({ error: 104 });
  });

  it("should prevent registration with invalid title length", () => {
    const longTitle = "a".repeat(101);
    const docHash = new Uint8Array(32).fill(1);
    const result = mockContract.registerPatent(
      "ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME",
      longTitle,
      "Desc",
      docHash
    );
    expect(result).toEqual({ error: 101 });
  });

  it("should prevent registration when paused", () => {
    mockContract.setPaused(mockContract.admin, true);
    const docHash = new Uint8Array(32).fill(1);
    const result = mockContract.registerPatent(
      "ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME",
      "Title",
      "Desc",
      docHash
    );
    expect(result).toEqual({ error: 108 });
  });

  it("should get patent by ID", () => {
    const docHash = new Uint8Array(32).fill(1);
    mockContract.registerPatent(
      "ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME",
      "Title",
      "Abstract",
      docHash
    );
    const result = mockContract.getPatent(1n);
    expect(result).toHaveProperty("value");
    if ("value" in result) {
      expect(result.value.title).toBe("Title");
    }
  });

  it("should get inventor patents list", () => {
    const docHash1 = new Uint8Array(32).fill(1);
    const docHash2 = new Uint8Array(32).fill(2);
    mockContract.registerPatent(
      "ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME",
      "Title1",
      "Abstract1",
      docHash1
    );
    mockContract.registerPatent(
      "ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME",
      "Title2",
      "Abstract2",
      docHash2
    );
    const result = mockContract.getInventorPatents("ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME");
    expect(result.value).toEqual([1n, 2n]);
  });

  it("should prevent exceeding max patents per inventor", () => {
    const caller = "ST2CY5V39NHDP5P0TP4KSYK3CKFS4CYVNP7BCDYME";
    for (let i = 0; i < 50; i++) {
      const docHash = new Uint8Array(32).fill(i);
      mockContract.registerPatent(caller, `Title${i}`, `Abstract${i}`, docHash);
    }
    const extraHash = new Uint8Array(32).fill(51);
    const result = mockContract.registerPatent(caller, "Extra", "Extra", extraHash);
    expect(result).toEqual({ error: 106 });
  });
});