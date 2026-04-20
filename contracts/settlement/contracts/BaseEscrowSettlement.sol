// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BaseEscrowSettlement {
    error ZeroAddress();
    error ZeroAmount();
    error NotOwner();
    error SameParticipant();
    error HandAlreadySettled(bytes32 handId);
    error InsufficientEscrowBalance(bytes32 tableId, address player, uint256 available, uint256 required);
    error TransferFailed();

    event OwnerTransferred(address indexed previousOwner, address indexed newOwner);
    event EscrowDeposited(bytes32 indexed tableId, address indexed player, uint256 amount, uint256 newBalance);
    event HandSettled(
        bytes32 indexed tableId,
        bytes32 indexed handId,
        address indexed winner,
        address loser,
        uint256 amount,
        bytes32 idempotencyKey,
        uint256 winnerEscrowBalance,
        uint256 loserEscrowBalance
    );
    event EscrowWithdrawn(bytes32 indexed tableId, address indexed player, uint256 amount, uint256 remainingBalance);

    address public owner;
    mapping(bytes32 => bool) public settledHands;
    mapping(bytes32 => mapping(address => uint256)) private escrowBalances;

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert ZeroAddress();
        }

        owner = initialOwner;
        emit OwnerTransferred(address(0), initialOwner);
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        if (nextOwner == address(0)) {
            revert ZeroAddress();
        }

        address previousOwner = owner;
        owner = nextOwner;
        emit OwnerTransferred(previousOwner, nextOwner);
    }

    function deposit(bytes32 tableId) external payable {
        if (msg.value == 0) {
            revert ZeroAmount();
        }

        uint256 updatedBalance = escrowBalances[tableId][msg.sender] + msg.value;
        escrowBalances[tableId][msg.sender] = updatedBalance;

        emit EscrowDeposited(tableId, msg.sender, msg.value, updatedBalance);
    }

    function settleHand(
        bytes32 tableId,
        bytes32 handId,
        address winner,
        address loser,
        uint256 amount,
        bytes32 idempotencyKey
    ) external onlyOwner {
        if (winner == address(0) || loser == address(0)) {
            revert ZeroAddress();
        }
        if (winner == loser) {
            revert SameParticipant();
        }
        if (amount == 0) {
            revert ZeroAmount();
        }
        if (settledHands[handId]) {
            revert HandAlreadySettled(handId);
        }

        uint256 loserEscrowBalance = escrowBalances[tableId][loser];
        if (loserEscrowBalance < amount) {
            revert InsufficientEscrowBalance(tableId, loser, loserEscrowBalance, amount);
        }

        uint256 winnerEscrowBalance = escrowBalances[tableId][winner] + amount;
        escrowBalances[tableId][winner] = winnerEscrowBalance;
        escrowBalances[tableId][loser] = loserEscrowBalance - amount;
        settledHands[handId] = true;

        emit HandSettled(
            tableId,
            handId,
            winner,
            loser,
            amount,
            idempotencyKey,
            winnerEscrowBalance,
            loserEscrowBalance - amount
        );
    }

    function withdraw(bytes32 tableId, uint256 amount) external {
        if (amount == 0) {
            revert ZeroAmount();
        }

        uint256 escrowBalance = escrowBalances[tableId][msg.sender];
        if (escrowBalance < amount) {
            revert InsufficientEscrowBalance(tableId, msg.sender, escrowBalance, amount);
        }

        escrowBalances[tableId][msg.sender] = escrowBalance - amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) {
            revert TransferFailed();
        }

        emit EscrowWithdrawn(tableId, msg.sender, amount, escrowBalance - amount);
    }

    function escrowBalanceOf(bytes32 tableId, address player) external view returns (uint256) {
        return escrowBalances[tableId][player];
    }

    receive() external payable {
        revert();
    }
}
