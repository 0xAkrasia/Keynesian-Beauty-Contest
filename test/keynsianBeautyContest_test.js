const { createInstance } = require("fhevmjs");
const { JsonRpcProvider } = require("ethers");
const { AbiCoder } = require('ethers');
const KeynsianBeautyContest = artifacts.require("KeynsianBeautyContest");

contract("KeynsianBeautyContest Tests", accounts => {
  const deployer = accounts[0];
  const addr1 = accounts[1];
  const addr2 = accounts[2];
  const addr3 = accounts[3];
  const addr4 = accounts[4];
  const addr5 = accounts[5];
  let keynesianBeautyContest;
  let instance; // The FHE instance

  

  before(async () => {
    const provider = new JsonRpcProvider(`https://testnet.inco.org`);
    const FHE_LIB_ADDRESS = "0x000000000000000000000000000000000000005d";
    const network = await provider.getNetwork();
    const chainId = +network.chainId.toString();
    const ret = await provider.call({
      to: FHE_LIB_ADDRESS,
      data: "0xd9d47bb001",
    });
    const decoded = AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
    const publicKey = decoded[0];
    instance = await createInstance({ chainId, publicKey });
    console.log("FHE instance created", instance);
    keynesianBeautyContest = await KeynsianBeautyContest.new({ from: deployer });
    //keynesianBeautyContest = await KeynsianBeautyContest.at('0x22cEe6ffECE58f7DE72B424Ac7e1453796dc33F4'); // Passed CONTRACT ADDRESS
    console.log("KeynesianBeautyContest deployed at", keynesianBeautyContest.address);
  });

  describe("Vote and check winner", () => {
    it("should let participants vote and determine the winner correctly", async () => {

      // Encrypt votes using the FHE instance before they are cast
      const encryptedVoteFor00001111 = instance.encrypt8(15);
      const encryptedVoteFor11110000 = instance.encrypt8(240);
      const encryptedVoteFor00111100 = instance.encrypt8(60);

      // Cast votes
      await keynesianBeautyContest.castVote(encryptedVoteFor00001111, { from: addr1 });
      await keynesianBeautyContest.castVote(encryptedVoteFor00001111, { from: addr2 });
      await keynesianBeautyContest.castVote(encryptedVoteFor11110000, { from: addr3 });
      await keynesianBeautyContest.castVote(encryptedVoteFor11110000, { from: addr4 });
      await keynesianBeautyContest.castVote(encryptedVoteFor00111100, { from: addr5 });

      // Reveal result
      await keynesianBeautyContest.revealResult({ from: deployer });

      //// Check the result
      const resultBit = await keynesianBeautyContest.resultBit();
      assert.equal(resultBit, "60", "The result bit should be 60 which is binary 00111100");

      //// Everyone checks if they won
      await keynesianBeautyContest.winCheck({ from: addr1 });
      await keynesianBeautyContest.winCheck({ from: addr2 });
      await keynesianBeautyContest.winCheck({ from: addr3 });
      await keynesianBeautyContest.winCheck({ from: addr4 });
      await keynesianBeautyContest.winCheck({ from: addr5 });

      // Addr5 should be the winner
      const winners = await keynesianBeautyContest.winners(0);
      assert.equal(winners, addr5, "The winner should be addr5");

      // Pay the winners - split the contract balance between the winners
      const contractBalanceBefore = await web3.eth.getBalance(keynesianBeautyContest.address);
      const winnerBalanceBefore = await web3.eth.getBalance(addr5);
      await keynesianBeautyContest.payWinners(0, 1, { from: deployer });

      // Check payment
      //const winnerBalanceAfter = await web3.eth.getBalance(addr5);
      //assert.isTrue(new web3.utils.BN(winnerBalanceAfter).gt(new web3.utils.BN(winnerBalanceBefore)), "Winner should have been paid");
    });
  });
});
