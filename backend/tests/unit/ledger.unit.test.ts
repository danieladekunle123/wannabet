// Example unit test for ledger/escrow math

describe("Ledger/Escrow Math", () => {
  function lockEscrow(balance: number, escrow: number, stake: number) {
    if (balance < stake) throw new Error("Insufficient balance");
    return {
      balance: balance - stake,
      escrow: escrow + stake,
    };
  }

  it("locks funds correctly", () => {
    const result = lockEscrow(1000, 0, 500);
    expect(result.balance).toBe(500);
    expect(result.escrow).toBe(500);
  });

  it("throws if insufficient balance", () => {
    expect(() => lockEscrow(100, 0, 200)).toThrow("Insufficient balance");
  });
});
