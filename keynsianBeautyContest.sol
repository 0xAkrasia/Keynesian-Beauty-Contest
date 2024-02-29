// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity >=0.8.13 <0.9.0;

import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/EIP712WithModifier.sol";
import "hardhat/console.sol";

contract KeynsianBeautyContest is EIP712WithModifier {
    address public owner;

    struct EncryptedVotes {
        euint8 encryptedChoices; // Single euint8 to store all 8 binary votes
    }

    mapping(address => bool) public hasVoted;
    mapping(address => bool) public hasPayed;
    mapping(address => EncryptedVotes) internal encryptedVotes;
    bool public gameOver;

    euint32[8] public candidates;
    uint256[8] public totals;
    uint8 public resultBit;
    uint8 public min_point;
    address[] public winners;

    constructor() EIP712WithModifier("Authorization token", "1") {
        owner = msg.sender;
        min_point = 255;
        for(uint i = 0; i < candidates.length; i++) {
            candidates[i] = TFHE.asEuint32(0);
        }
    }

    modifier OnlyOwner {
        require(msg.sender == owner, "Only Owner");
        _;
    }

    modifier gameEnded {
        require(gameOver, "The game is not over");
        _;
    }

    function castVote(bytes calldata vote) public {
        require(!gameOver, "The game has ended");
        require(!hasVoted[msg.sender], "Already voted");
        euint8 totalVotes = TFHE.asEuint8(0);
        euint8 encryptedVote = TFHE.asEuint8(vote);

        for (uint8 i = 0; i < 8; i++) {
            euint8 bitMask = TFHE.asEuint8(1 << i);
            euint8 voteBit = TFHE.and(encryptedVote, bitMask);
            totalVotes = TFHE.add(totalVotes, voteBit);
            candidates[i] = TFHE.add(candidates[i], voteBit);
        }
        encryptedVotes[msg.sender] = EncryptedVotes(encryptedVote);
        hasVoted[msg.sender] = true;
    }


    function quickSortWithIndices(uint[] memory arr, uint[] memory indices, int left, int right) internal pure {
        int i = left;
        int j = right;
        if(i >= j) return;
        uint pivot = arr[uint(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint(i)] < pivot) i++;
            while (pivot < arr[uint(j)]) j--;
            if (i <= j) {
                // Swap the values
                (arr[uint(i)], arr[uint(j)]) = (arr[uint(j)], arr[uint(i)]);
                // Swap the indices
                (indices[uint(i)], indices[uint(j)]) = (indices[uint(j)], indices[uint(i)]);

                i++;
                j--;
            }
        }
        if (left < j)
            quickSortWithIndices(arr, indices, left, j);
        if (i < right)
            quickSortWithIndices(arr, indices, i, right);
    }

    function revealResult() public OnlyOwner {
        require(!gameOver, "The game has already ended");
        uint[] memory totalsCopy = new uint[](totals.length);
        for (uint i = 0; i < totals.length; i++) {
            totalsCopy[i] = TFHE.decrypt(candidates[i]); // Assuming this is correct
        }
        uint[] memory indices = new uint[](totals.length);
        for (uint i = 0; i < totals.length; i++) {
            indices[i] = i;
        }
        quickSortWithIndices(totalsCopy, indices, 0, int(totalsCopy.length - 1));

        resultBit = 0;
        for (uint i = 0; i < totals.length; i++) {
            if (i < 4) {
                resultBit |= (uint8(1) << uint8(indices[i]));
            }
        }

        gameOver = true;
    }

    function viewOwnVote(bytes32 publicKey, bytes calldata signature) public view onlySignedPublicKey(publicKey, signature) returns (bytes memory) {
        return TFHE.reencrypt(encryptedVotes[msg.sender].encryptedChoices, publicKey);
    }

    function winCheck() public gameEnded {
        require(hasVoted[msg.sender], "You haven't voted");
        uint8 myVote = TFHE.decrypt(encryptedVotes[msg.sender].encryptedChoices);

        uint8 points = resultBit ^ myVote;
        if (points < min_point) {
            delete winners;
            max_point = points;
            winners.push(msg.sender);
        } else if (points == max_point) {
            winners.push(msg.sender);
        }
    }

    function payWinners(uint32 start, uint32 offset) public OnlyOwner gameEnded {
        require(start < candidates.length, "Start index out of range");
        require(offset > 0 && start + offset <= candidates.length, "Invalid offset");

        uint256 prize = address(this).balance / winners.length;
        for (uint256 i = start; i < start + offset; i++) {
            if (!hasPayed[winners[i]]) {
                payable(winners[i]).transfer(prize);
                hasPayed[winners[i]] = true;
            }
        }
    }
}