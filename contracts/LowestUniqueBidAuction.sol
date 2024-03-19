// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.13;

import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/EIP712WithModifier.sol";
import "hardhat/console.sol";

contract LowestUniqueBidAuction is EIP712WithModifier {
    address public owner;
    uint public auctionEndTime;
    bool public auctionEnded;

    struct Bid {
        euint32 encryptedBidAmount; // encrypted bid using FHE
    }

    mapping(address => Bid[]) internal encryptedBids;
    mapping(uint32 => uint32) internal bidCount;
    uint32 lowestUniqueBidAmount;
    address winner;

    event AuctionEnded(address indexed winner, uint32 lowestUniqueBidAmount);

    constructor(uint _biddingTime)
        EIP712WithModifier("LowestUniqueBidAuction", "1")
    {
        owner = msg.sender;
        auctionEndTime = block.timestamp + _biddingTime;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the auction owner");
        _;
    }

    modifier beforeAuctionEnds() {
        require(block.timestamp < auctionEndTime, "Auction already ended");
        _;
    }

    modifier auctionNotEnded() {
        require(!auctionEnded, "Auction ended");
        _;
    }

    function placeBid(bytes calldata bid) external beforeAuctionEnds {
        euint32 encryptedBidAmount = TFHE.asEuint32(bid);
        encryptedBids[msg.sender].push(Bid(encryptedBidAmount));
    }

    function winCheck() public auctionNotEnded {
        Bid[] storage myBids = encryptedBids[msg.sender];

        for (uint i=0; i<myBids.length; i++) {
            uint32 myBid = TFHE.decrypt(myBids[i].encryptedBidAmount);
            uint32 cnt = bidCount[myBid];
            if (cnt == 0 && myBid<lowestUniqueBidAmount) {
                lowestUniqueBidAmount = myBid;
                winner = msg.sender;
            }
            bidCount[myBid]++;
        }
    }

    function winCheckFor(address candicate) public auctionNotEnded {
        Bid[] storage myBids = encryptedBids[candicate];

        for (uint i=0; i<myBids.length; i++) {
            uint32 myBid = TFHE.decrypt(myBids[i].encryptedBidAmount);
            uint32 cnt = bidCount[myBid];
            if (cnt == 0 && myBid<lowestUniqueBidAmount) {
                lowestUniqueBidAmount = myBid;
                winner = candicate;
            }
            bidCount[myBid]++;
        }
    }

    function revealBids() public onlyOwner {
        require(block.timestamp >= auctionEndTime, "Auction not yet ended");
        require(!auctionEnded, "Auction already ended");
        // TODO win check for the rest
        auctionEnded = true;
    }

    function determineWinner() public onlyOwner {
        require(auctionEnded, "Auction not ended yet");

        if (winner != address(0)) {
            // Assuming the prize amount is simply the balance of the contract,
            // which might be different in a real-world scenario.
            uint256 prizeAmount = address(this).balance;
            payable(winner).transfer(prizeAmount);
        }

        emit AuctionEnded(winner, lowestUniqueBidAmount);
    }

    function viewOwnBid(uint32 index, bytes32 publicKey, bytes calldata signature) public view onlySignedPublicKey(publicKey, signature) returns (bytes memory) {
        return TFHE.reencrypt(encryptedBids[msg.sender][index].encryptedBidAmount, publicKey);
    }
}
