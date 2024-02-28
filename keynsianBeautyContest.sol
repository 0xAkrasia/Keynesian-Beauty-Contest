// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity >=0.8.13 <0.9.0;

import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/EIP712WithModifier.sol";
import "hardhat/console.sol";

contract KeynsianBeautyContest is EIP712WithModifier {
    address public owner;

    struct EncryptedVotes {
        euint32[8] encryptedChoices; // Array of encrypted votes for each candidate
    }

    mapping(address => bool) public hasVoted;
    mapping(address => bool) public hasPayed;
    mapping(address => EncryptedVotes) internal encryptedVotes;
    bool public gameOver;

    euint32[8] public candidates;
    uint256[8] public totals;
    uint[8] public sortedIndex;
    uint8 public max_point;
    address[] public winners;

    constructor() EIP712WithModifier("Authorization token", "1") {
        owner = msg.sender;
        max_point = 0;
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

    function castVote(euint32[8] calldata votes) public {
        require(!gameOver, "The game has ended");
        require(!hasVoted[msg.sender], "Already voted");

        // First initialize total votes to a uint32 zero
        euint32 totalVotes;

        // Iterate over the votes to check they are valid
        for (uint i = 0; i < votes.length; i++) {
            ebool isVoteZero = TFHE.eq(votes[i], TFHE.asEuint32(0));
            ebool isVoteOne = TFHE.eq(votes[i], TFHE.asEuint32(1));
            ebool z_or_one = TFHE.or(isVoteZero, isVoteOne);
            TFHE.optReq(z_or_one);
            TFHE.add(totalVotes, votes[i]);
        }
        ebool eqFour = TFHE.eq(totalVotes, TFHE.asEuint32(4));
        TFHE.optReq(eqFour);

        // Save the encrypted votes
        encryptedVotes[msg.sender] = EncryptedVotes(votes);

        // Add each vote to the corresponding candidate
        for (uint i = 0; i < candidates.length; i++) {
            candidates[i] = TFHE.add(candidates[i], votes[i]);
        }

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
        // Populate the totals and indices
        uint[] memory totalsCopy = new uint[](totals.length);
        for (uint i = 0; i < totals.length; i++) {
            totalsCopy[i] = TFHE.decrypt(candidates[i]); // Assuming this is correct
        }
        
        uint[] memory indices = new uint[](totals.length);
        for (uint i = 0; i < totals.length; i++) {
            indices[i] = i;
        }

        // Sort the totals with their corresponding indices
        quickSortWithIndices(totalsCopy, indices, 0, int(totalsCopy.length - 1));

        // Update the sortedIndex with sorted indices
        for (uint i = 0; i < totals.length; i++) {
            sortedIndex[i] = indices[i];
        }

        gameOver = true;
    }

    function viewOwnVote(bytes32 publicKey, bytes calldata signature) public view onlySignedPublicKey(publicKey, signature) returns (bytes[] memory) {
        require(hasVoted[msg.sender], "No vote recorded for this address");

        EncryptedVotes storage vote = encryptedVotes[msg.sender];
        bytes[] memory reencryptedVotes = new bytes[](8);

        for (uint i = 0; i < vote.encryptedChoices.length; i++) {
            reencryptedVotes[i] = TFHE.reencrypt(vote.encryptedChoices[i], publicKey);
        }

        return reencryptedVotes;
    }

    function winCheck() public gameEnded {
        require(hasVoted[msg.sender], "You haven't voted");
        uint32[8] memory decryptedVotes = getDecryptedVotesFor(msg.sender);

        uint8 points = 0;
        for (uint8 i = 0; i < 4; i++) {
            if (decryptedVotes[sortedIndex[i]] == 1) {
                points++;
            }
        }
        if (points > max_point) {
            delete winners;
            max_point = points;
            winners.push(msg.sender);
        } else if (points == max_point) {
            winners.push(msg.sender);
        }
    }

    function getDecryptedVotesFor(address voter) internal view returns (uint32[8] memory decryptedVotes) {
        for (uint8 i = 0; i < 8; i++) {
            decryptedVotes[i] = TFHE.decrypt(encryptedVotes[voter].encryptedChoices[i]);
        }
        return decryptedVotes;
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