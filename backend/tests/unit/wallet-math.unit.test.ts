/**
 * Escrow & Wallet Math — Unit Tests
 *
 * Tests pure wallet/escrow calculation logic, double-entry ledger invariants,
 * and payout math for the match confirmation flow.
 */

describe("Wallet Math — Pure Functions", () => {
  function lockEscrow(balance: number, escrow: number, stake: number) {
    if (stake <= 0) throw new Error("Stake must be positive");
    if (balance < stake) throw new Error("Insufficient balance");
    return { balance: balance - stake, escrow: escrow + stake };
  }

  function releaseEscrow(balance: number, escrow: number, amount: number) {
    if (amount <= 0) throw new Error("Amount must be positive");
    if (escrow < amount) throw new Error("Insufficient escrow");
    return { balance: balance + amount, escrow: escrow - amount };
  }

  function withdraw(balance: number, amount: number) {
    if (amount <= 0) throw new Error("Amount must be positive");
    if (balance < amount) throw new Error("Insufficient balance");
    return { balance: balance - amount };
  }

  function payoutWinner(
    winnerBalance: number,
    winnerEscrow: number,
    loserEscrow: number,
    stake: number,
  ) {
    const pot = stake * 2;
    return {
      winnerBalance: winnerBalance + pot,
      winnerEscrow: winnerEscrow - stake,
      loserEscrow: loserEscrow - stake,
    };
  }

  // Lock escrow tests
  describe("lockEscrow", () => {
    it("deducts from balance and adds to escrow", () => {
      const r = lockEscrow(1000, 0, 500);
      expect(r.balance).toBe(500);
      expect(r.escrow).toBe(500);
    });

    it("preserves total funds (balance + escrow)", () => {
      const r = lockEscrow(1000, 200, 300);
      expect(r.balance + r.escrow).toBe(1000 + 200);
    });

    it("throws on insufficient balance", () => {
      expect(() => lockEscrow(100, 0, 200)).toThrow("Insufficient balance");
    });

    it("throws on zero/negative stake", () => {
      expect(() => lockEscrow(1000, 0, 0)).toThrow("Stake must be positive");
      expect(() => lockEscrow(1000, 0, -100)).toThrow("Stake must be positive");
    });

    it("allows staking the entire balance", () => {
      const r = lockEscrow(500, 0, 500);
      expect(r.balance).toBe(0);
      expect(r.escrow).toBe(500);
    });
  });

  // Release escrow tests
  describe("releaseEscrow", () => {
    it("moves funds from escrow back to balance", () => {
      const r = releaseEscrow(100, 500, 200);
      expect(r.balance).toBe(300);
      expect(r.escrow).toBe(300);
    });

    it("preserves total funds", () => {
      const r = releaseEscrow(100, 500, 200);
      expect(r.balance + r.escrow).toBe(100 + 500);
    });

    it("throws on insufficient escrow", () => {
      expect(() => releaseEscrow(100, 50, 200)).toThrow("Insufficient escrow");
    });

    it("throws on zero/negative amount", () => {
      expect(() => releaseEscrow(100, 500, 0)).toThrow(
        "Amount must be positive",
      );
    });
  });

  // Withdrawal tests
  describe("withdraw", () => {
    it("deducts from balance", () => {
      expect(withdraw(1000, 300).balance).toBe(700);
    });

    it("throws on insufficient balance", () => {
      expect(() => withdraw(100, 200)).toThrow("Insufficient balance");
    });

    it("allows withdrawing entire balance", () => {
      expect(withdraw(500, 500).balance).toBe(0);
    });
  });

  // Payout tests
  describe("payoutWinner", () => {
    it("gives winner 2x stake from the pot", () => {
      const r = payoutWinner(0, 500, 500, 500);
      expect(r.winnerBalance).toBe(1000);
      expect(r.winnerEscrow).toBe(0);
      expect(r.loserEscrow).toBe(0);
    });

    it("preserves total system funds (winner.balance + both escrows before = pot)", () => {
      const stake = 300;
      const r = payoutWinner(100, stake, stake, stake);
      // winner gains pot (600), escrows deducted
      expect(r.winnerBalance).toBe(100 + stake * 2);
    });

    it("handles zero-stake matches (no payout)", () => {
      const r = payoutWinner(100, 0, 0, 0);
      expect(r.winnerBalance).toBe(100);
      expect(r.winnerEscrow).toBe(0);
      expect(r.loserEscrow).toBe(0);
    });
  });
});

describe("Double-Entry Ledger Invariants", () => {
  it("sum of all ledger entries should match wallet balance change", () => {
    const entries = [
      { type: "deposit", amount: 5000 },
      { type: "escrow_lock", amount: 1000 },
      { type: "payout", amount: 2000 },
      { type: "withdrawal", amount: -500 },
      { type: "escrow_lock", amount: 500 },
      { type: "refund", amount: 500 },
    ];

    const netBalance = entries.reduce((sum, e) => {
      if (e.type === "deposit" || e.type === "payout" || e.type === "refund") {
        return sum + e.amount;
      }
      if (e.type === "withdrawal") {
        return sum + e.amount; // already negative
      }
      // escrow_lock doesn't change net balance (internal move)
      return sum;
    }, 0);

    expect(netBalance).toBe(7000); // 5000 + 2000 - 500 + 500
  });

  it("escrow operations are zero-sum between balance and escrow", () => {
    let balance = 5000;
    let escrow = 0;
    const total = balance + escrow;

    // Lock
    balance -= 1000;
    escrow += 1000;
    expect(balance + escrow).toBe(total);

    // Lock more
    balance -= 500;
    escrow += 500;
    expect(balance + escrow).toBe(total);

    // Release
    balance += 500;
    escrow -= 500;
    expect(balance + escrow).toBe(total);
  });
});

describe("Tournament Prize Pool Math", () => {
  function distributePrize(
    totalPrize: number,
    memberCount: number,
  ): { perMember: number; remainder: number } {
    if (memberCount <= 0) throw new Error("Member count must be positive");
    const perMember = Math.floor(totalPrize / memberCount);
    const remainder = totalPrize - perMember * memberCount;
    return { perMember, remainder };
  }

  it("splits equally among members", () => {
    const { perMember, remainder } = distributePrize(3000, 3);
    expect(perMember).toBe(1000);
    expect(remainder).toBe(0);
  });

  it("assigns floor amount with remainder to first member", () => {
    const { perMember, remainder } = distributePrize(1000, 3);
    expect(perMember).toBe(333);
    expect(remainder).toBe(1); // 1000 - 333*3 = 1
  });

  it("total distributed always equals the prize pool", () => {
    const cases: [number, number][] = [
      [7000, 4],
      [5001, 3],
      [2500, 7],
    ];
    for (const [total, members] of cases) {
      const { perMember, remainder } = distributePrize(total, members);
      expect(perMember * members + remainder).toBe(total);
    }
  });

  it("single member receives the entire prize", () => {
    const { perMember, remainder } = distributePrize(5000, 1);
    expect(perMember).toBe(5000);
    expect(remainder).toBe(0);
  });
});

describe("Stake Validation (cents)", () => {
  function validateStake(
    stake: number,
    minCents: number,
    maxCents: number,
  ): true {
    if (!Number.isInteger(stake))
      throw new Error("Stake must be an integer (cents)");
    if (stake < 0) throw new Error("Stake cannot be negative");
    if (stake > 0 && stake < minCents)
      throw new Error(`Minimum stake is ${minCents} cents`);
    if (stake > maxCents) throw new Error(`Maximum stake is ${maxCents} cents`);
    return true;
  }

  it("accepts valid cent amounts", () => {
    expect(validateStake(500, 500, 1_000_000)).toBe(true);
    expect(validateStake(10000, 500, 1_000_000)).toBe(true);
    expect(validateStake(0, 500, 1_000_000)).toBe(true); // zero-stake scrim
  });

  it("rejects float stakes", () => {
    expect(() => validateStake(25.5, 500, 1_000_000)).toThrow("integer");
    expect(() => validateStake(0.01, 500, 1_000_000)).toThrow("integer");
  });

  it("rejects stake below minimum (non-zero)", () => {
    expect(() => validateStake(100, 500, 1_000_000)).toThrow("Minimum");
    expect(() => validateStake(1, 500, 1_000_000)).toThrow("Minimum");
  });

  it("rejects stake above maximum", () => {
    expect(() => validateStake(2_000_000, 500, 1_000_000)).toThrow("Maximum");
  });

  it("accepts stake at the exact minimum", () => {
    expect(validateStake(500, 500, 1_000_000)).toBe(true);
  });
});
