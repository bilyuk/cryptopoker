const { strict: assert } = require("node:assert");
const hre = require("hardhat");

const toId = (value) => hre.ethers.keccak256(hre.ethers.toUtf8Bytes(value));

describe("BaseEscrowSettlement", () => {
  it("records deposits, settles once, and emits settlement ids", async () => {
    const [owner, hero, villain] = await hre.ethers.getSigners();
    const factory = await hre.ethers.getContractFactory("BaseEscrowSettlement");
    const contract = await factory.deploy(owner.address);
    await contract.waitForDeployment();

    const tableId = toId("table-1");
    const handId = toId("table-1:hand-1");
    const idempotencyKey = toId("table-1:hand-1:v1");

    await (await contract.connect(villain).deposit(tableId, { value: hre.ethers.parseEther("2") })).wait();
    await (await contract.connect(hero).deposit(tableId, { value: hre.ethers.parseEther("1") })).wait();

    const settleTx = await contract
      .connect(owner)
      .settleHand(tableId, handId, hero.address, villain.address, hre.ethers.parseEther("0.4"), idempotencyKey);
    const settleReceipt = await settleTx.wait();

    const settlementLog = settleReceipt.logs
      .map((entry) => {
        try {
          return contract.interface.parseLog(entry);
        } catch {
          return null;
        }
      })
      .find((entry) => entry && entry.name === "HandSettled");

    assert.ok(settlementLog);
    assert.equal(settlementLog.args.tableId, tableId);
    assert.equal(settlementLog.args.handId, handId);
    assert.equal(settlementLog.args.idempotencyKey, idempotencyKey);

    const heroBalance = await contract.escrowBalanceOf(tableId, hero.address);
    const villainBalance = await contract.escrowBalanceOf(tableId, villain.address);

    assert.equal(heroBalance.toString(), hre.ethers.parseEther("1.4").toString());
    assert.equal(villainBalance.toString(), hre.ethers.parseEther("1.6").toString());
    assert.equal(await contract.settledHands(handId), true);
  });

  it("rejects duplicate settlement and over-withdrawal", async () => {
    const [owner, hero, villain] = await hre.ethers.getSigners();
    const factory = await hre.ethers.getContractFactory("BaseEscrowSettlement");
    const contract = await factory.deploy(owner.address);
    await contract.waitForDeployment();

    const tableId = toId("table-2");
    const handId = toId("table-2:hand-1");
    const idempotencyKey = toId("table-2:hand-1:v1");

    await (await contract.connect(villain).deposit(tableId, { value: hre.ethers.parseEther("1") })).wait();

    await (
      await contract
        .connect(owner)
        .settleHand(tableId, handId, hero.address, villain.address, hre.ethers.parseEther("0.25"), idempotencyKey)
    ).wait();

    await assert.rejects(
      contract
        .connect(owner)
        .settleHand(tableId, handId, hero.address, villain.address, hre.ethers.parseEther("0.25"), idempotencyKey),
      /HandAlreadySettled/
    );

    await assert.rejects(
      contract.connect(hero).withdraw(tableId, hre.ethers.parseEther("5")),
      /InsufficientEscrowBalance/
    );
  });
});
