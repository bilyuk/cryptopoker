// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RoomEscrow {
  error RoomNotRegistered();
  error UnsupportedToken();
  error InvalidAmount();
  error PermitAlreadyUsed();
  error PermitMismatch();

  event RoomRegistered(bytes32 indexed roomId);
  event FundingIntentCreated(
    bytes32 indexed permitId,
    bytes32 indexed roomId,
    address indexed player,
    address token,
    uint256 amount
  );
  event FundingRecorded(
    bytes32 indexed roomId,
    address indexed player,
    bytes32 indexed permitId,
    address token,
    uint256 amount
  );

  // Base Sepolia native USDC token address.
  address public immutable usdcToken;

  mapping(bytes32 => bool) public registeredRooms;
  mapping(bytes32 => bytes32) public permitIntentHashById;
  mapping(bytes32 => bool) public consumedPermitId;

  constructor(address usdcTokenAddress) {
    usdcToken = usdcTokenAddress;
  }

  function version() external pure returns (string memory) {
    return "funding-tracer-v1";
  }

  function registerRoom(bytes32 roomId) external {
    registeredRooms[roomId] = true;
    emit RoomRegistered(roomId);
  }

  function createPermitIntent(
    bytes32 permitId,
    bytes32 roomId,
    address player,
    address token,
    uint256 amount
  ) external {
    if (!registeredRooms[roomId]) revert RoomNotRegistered();
    if (token != usdcToken) revert UnsupportedToken();
    if (amount == 0) revert InvalidAmount();

    bytes32 intentHash = keccak256(abi.encode(permitId, roomId, player, token, amount));
    permitIntentHashById[permitId] = intentHash;
    consumedPermitId[permitId] = false;

    emit FundingIntentCreated(permitId, roomId, player, token, amount);
  }

  function fundWithPermit(
    bytes32 permitId,
    bytes32 roomId,
    address player,
    address token,
    uint256 amount
  ) external {
    if (consumedPermitId[permitId]) revert PermitAlreadyUsed();
    bytes32 expected = permitIntentHashById[permitId];
    bytes32 actual = keccak256(abi.encode(permitId, roomId, player, token, amount));
    if (expected == bytes32(0) || expected != actual) revert PermitMismatch();
    if (token != usdcToken) revert UnsupportedToken();
    if (!registeredRooms[roomId]) revert RoomNotRegistered();
    if (amount == 0) revert InvalidAmount();

    consumedPermitId[permitId] = true;
    emit FundingRecorded(roomId, player, permitId, token, amount);
  }
}
