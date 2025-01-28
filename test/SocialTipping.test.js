const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SocialTipping", function () {
  let SocialTipping;
  let socialTipping;
  let owner;
  let creator;
  let tipper;

  beforeEach(async function () {
    // Get signers
    [owner, creator, tipper] = await ethers.getSigners();

    // Deploy contract
    SocialTipping = await ethers.getContractFactory("SocialTipping");
    socialTipping = await SocialTipping.deploy();
    await socialTipping.deployed();
  });

  describe("Creator Registration", function () {
    it("Should allow a user to register as creator", async function () {
      await socialTipping.connect(creator).registerCreator("Test Creator", "Test Description");
      
      const creatorInfo = await socialTipping.getCreator(creator.address);
      expect(creatorInfo.name).to.equal("Test Creator");
      expect(creatorInfo.description).to.equal("Test Description");
      expect(creatorInfo.isRegistered).to.be.true;
    });

    it("Should emit CreatorRegistered event", async function () {
      await expect(socialTipping.connect(creator).registerCreator("Test Creator", "Test Description"))
        .to.emit(socialTipping, "CreatorRegistered")
        .withArgs(creator.address, "Test Creator");
    });

    it("Should not allow duplicate registration", async function () {
      await socialTipping.connect(creator).registerCreator("Test Creator", "Test Description");
      
      await expect(
        socialTipping.connect(creator).registerCreator("Another Name", "Another Description")
      ).to.be.revertedWith("Creator already registered");
    });
  });

  describe("Tipping", function () {
    beforeEach(async function () {
      // Register a creator before tipping tests
      await socialTipping.connect(creator).registerCreator("Test Creator", "Test Description");
    });

    it("Should allow tipping a creator", async function () {
      const tipAmount = ethers.utils.parseEther("1.0");
      const initialBalance = await creator.getBalance();

      await socialTipping.connect(tipper).tipCreator(creator.address, { value: tipAmount });

      const creatorInfo = await socialTipping.getCreator(creator.address);
      expect(creatorInfo.totalTips).to.equal(tipAmount);

      const finalBalance = await creator.getBalance();
      expect(finalBalance.sub(initialBalance)).to.equal(tipAmount);
    });

    it("Should emit TipSent event", async function () {
      const tipAmount = ethers.utils.parseEther("1.0");

      await expect(socialTipping.connect(tipper).tipCreator(creator.address, { value: tipAmount }))
        .to.emit(socialTipping, "TipSent")
        .withArgs(tipper.address, creator.address, tipAmount);
    });

    it("Should not allow tipping unregistered creator", async function () {
      const tipAmount = ethers.utils.parseEther("1.0");
      
      await expect(
        socialTipping.connect(tipper).tipCreator(tipper.address, { value: tipAmount })
      ).to.be.revertedWith("Creator not registered");
    });

    it("Should not allow zero tip amount", async function () {
      await expect(
        socialTipping.connect(tipper).tipCreator(creator.address, { value: 0 })
      ).to.be.revertedWith("Tip amount must be greater than 0");
    });
  });

  describe("Creator Listing", function () {
    it("Should return all registered creators", async function () {
      // Register multiple creators
      await socialTipping.connect(creator).registerCreator("Creator 1", "Description 1");
      await socialTipping.connect(tipper).registerCreator("Creator 2", "Description 2");

      const allCreators = await socialTipping.getAllCreators();
      expect(allCreators.length).to.equal(2);
      expect(allCreators[0].name).to.equal("Creator 1");
      expect(allCreators[1].name).to.equal("Creator 2");
    });

    it("Should return correct creator details", async function () {
      await socialTipping.connect(creator).registerCreator("Test Creator", "Test Description");

      const creatorInfo = await socialTipping.getCreator(creator.address);
      expect(creatorInfo.name).to.equal("Test Creator");
      expect(creatorInfo.description).to.equal("Test Description");
      expect(creatorInfo.walletAddress).to.equal(creator.address);
      expect(creatorInfo.totalTips).to.equal(0);
      expect(creatorInfo.isRegistered).to.be.true;
    });
  });
}); 