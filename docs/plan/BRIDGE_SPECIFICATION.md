# Selendra Bridge Specification

> **Cross-Chain Bridge** - BSC ↔ Selendra Native

---

## Overview

The Selendra Bridge enables secure token transfers between BSC (BNB Smart Chain) and Selendra Native blockchain. It's designed with built-in friction to discourage dumping while enabling legitimate cross-chain activity.

---

## Design Goals

| Goal | Description |
|------|-------------|
| **Security** | Multi-sig validation, time delays |
| **Friction** | Discourage small dumpers |
| **Fee Capture** | Burns + treasury revenue |
| **Decentralization** | Relayer network, not single operator |
| **Transparency** | All operations verifiable on-chain |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BRIDGE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BSC CHAIN                              SELENDRA CHAIN              │
│  ─────────                              ──────────────              │
│                                                                     │
│  ┌─────────────┐                        ┌─────────────┐             │
│  │   SEL BEP20 │                        │  SEL Native │             │
│  │   Token     │                        │   Token     │             │
│  └──────┬──────┘                        └──────┬──────┘             │
│         │                                      │                    │
│         ▼                                      ▼                    │
│  ┌─────────────┐                        ┌─────────────┐             │
│  │   Bridge    │◄───── Relayers ───────▶│   Bridge    │             │
│  │   Contract  │      (Validators)      │   Contract  │             │
│  │   (Lock)    │                        │   (Mint)    │             │
│  └─────────────┘                        └─────────────┘             │
│                                                                     │
│  User deposits SEL    ──────────────▶   User receives SEL           │
│  (locked in contract)                   (minted on Selendra)        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  REVERSE FLOW                                                       │
│                                                                     │
│  User burns SEL       ◀──────────────   User deposits SEL           │
│  (released from lock)                   (burned on Selendra)        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Bridge Types

### 1. Lock & Mint (BSC → Selendra)

```
Step 1: User deposits SEL (BEP20) to BSC Bridge Contract
        └── SEL is LOCKED in contract

Step 2: Relayers observe deposit event
        └── Wait for confirmations (15 blocks)

Step 3: Relayers submit attestation to Selendra
        └── Multi-sig: 3 of 5 required

Step 4: Selendra Bridge mints equivalent SEL
        └── Minus bridge fee (0.5%)

Step 5: User receives SEL on Selendra
        └── After time delay (15 minutes)
```

### 2. Burn & Release (Selendra → BSC)

```
Step 1: User deposits SEL (Native) to Selendra Bridge
        └── SEL is BURNED on Selendra

Step 2: Relayers observe burn event
        └── Wait for finality

Step 3: Relayers submit attestation to BSC
        └── Multi-sig: 3 of 5 required

Step 4: BSC Bridge releases locked SEL
        └── Minus bridge fee (0.5%)

Step 5: User receives SEL (BEP20) on BSC
        └── After time delay (15 minutes)
```

---

## Smart Contracts

### BSC Bridge Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SelendraBridgeBSC is ReentrancyGuard, Pausable {
    
    // ============ Constants ============
    
    IERC20 public immutable selToken;
    
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant BRIDGE_FEE = 50;          // 0.50%
    uint256 public constant BURN_PORTION = 50;        // 50% of fee burned
    uint256 public constant MIN_BRIDGE_AMOUNT = 10000 * 1e18;  // 10,000 SEL
    uint256 public constant MAX_DAILY_LIMIT = 1000000 * 1e18;  // 1M SEL per wallet
    uint256 public constant REQUIRED_CONFIRMATIONS = 15;
    uint256 public constant RELEASE_DELAY = 15 minutes;
    
    // ============ State ============
    
    address public treasury;
    address public burnAddress;
    
    mapping(address => bool) public relayers;
    uint256 public requiredSignatures;
    
    mapping(bytes32 => bool) public processedDeposits;
    mapping(bytes32 => bool) public processedReleases;
    mapping(bytes32 => uint256) public releaseTimestamps;
    
    mapping(address => uint256) public dailyBridged;
    mapping(address => uint256) public lastBridgeDay;
    
    uint256 public totalLocked;
    uint256 public totalBridgedToSelendra;
    uint256 public totalReleasedFromSelendra;
    
    // ============ Events ============
    
    event Deposit(
        address indexed from,
        bytes32 indexed depositId,
        uint256 amount,
        uint256 fee,
        string selendraAddress,
        uint256 timestamp
    );
    
    event ReleaseInitiated(
        address indexed to,
        bytes32 indexed releaseId,
        uint256 amount,
        uint256 unlockTime
    );
    
    event ReleaseCompleted(
        address indexed to,
        bytes32 indexed releaseId,
        uint256 amount
    );
    
    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);
    
    // ============ Constructor ============
    
    constructor(
        address _selToken,
        address _treasury,
        address _burnAddress,
        address[] memory _initialRelayers,
        uint256 _requiredSignatures
    ) {
        selToken = IERC20(_selToken);
        treasury = _treasury;
        burnAddress = _burnAddress;
        requiredSignatures = _requiredSignatures;
        
        for (uint256 i = 0; i < _initialRelayers.length; i++) {
            relayers[_initialRelayers[i]] = true;
            emit RelayerAdded(_initialRelayers[i]);
        }
    }
    
    // ============ Bridge: BSC → Selendra ============
    
    function deposit(
        uint256 amount,
        string calldata selendraAddress
    ) external nonReentrant whenNotPaused returns (bytes32 depositId) {
        require(amount >= MIN_BRIDGE_AMOUNT, "Amount too small");
        require(bytes(selendraAddress).length > 0, "Invalid Selendra address");
        
        // Check daily limit
        _checkDailyLimit(msg.sender, amount);
        
        // Calculate fee
        uint256 fee = (amount * BRIDGE_FEE) / FEE_DENOMINATOR;
        uint256 burnAmount = (fee * BURN_PORTION) / 100;
        uint256 treasuryAmount = fee - burnAmount;
        uint256 netAmount = amount - fee;
        
        // Transfer tokens
        require(selToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Handle fees
        require(selToken.transfer(burnAddress, burnAmount), "Burn transfer failed");
        require(selToken.transfer(treasury, treasuryAmount), "Treasury transfer failed");
        
        // Update state
        totalLocked += netAmount;
        totalBridgedToSelendra += netAmount;
        
        // Generate deposit ID
        depositId = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            selendraAddress,
            block.number,
            block.timestamp
        ));
        
        emit Deposit(msg.sender, depositId, netAmount, fee, selendraAddress, block.timestamp);
    }
    
    // ============ Bridge: Selendra → BSC ============
    
    function initiateRelease(
        address to,
        uint256 amount,
        bytes32 selendraTransactionHash,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused returns (bytes32 releaseId) {
        require(_verifySignatures(selendraTransactionHash, signatures), "Invalid signatures");
        require(!processedReleases[selendraTransactionHash], "Already processed");
        
        // Calculate fee
        uint256 fee = (amount * BRIDGE_FEE) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;
        
        require(netAmount <= totalLocked, "Insufficient locked tokens");
        
        releaseId = selendraTransactionHash;
        releaseTimestamps[releaseId] = block.timestamp + RELEASE_DELAY;
        processedReleases[releaseId] = true;
        
        emit ReleaseInitiated(to, releaseId, netAmount, releaseTimestamps[releaseId]);
    }
    
    function completeRelease(
        bytes32 releaseId,
        address to,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(releaseTimestamps[releaseId] > 0, "Release not initiated");
        require(block.timestamp >= releaseTimestamps[releaseId], "Release delay not passed");
        
        uint256 fee = (amount * BRIDGE_FEE) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;
        
        // Handle fees
        uint256 burnAmount = (fee * BURN_PORTION) / 100;
        uint256 treasuryAmount = fee - burnAmount;
        
        require(selToken.transfer(to, netAmount), "Transfer failed");
        require(selToken.transfer(burnAddress, burnAmount), "Burn transfer failed");
        require(selToken.transfer(treasury, treasuryAmount), "Treasury transfer failed");
        
        totalLocked -= amount;
        totalReleasedFromSelendra += netAmount;
        
        delete releaseTimestamps[releaseId];
        
        emit ReleaseCompleted(to, releaseId, netAmount);
    }
    
    // ============ Internal ============
    
    function _checkDailyLimit(address user, uint256 amount) internal {
        uint256 today = block.timestamp / 1 days;
        
        if (lastBridgeDay[user] < today) {
            dailyBridged[user] = 0;
            lastBridgeDay[user] = today;
        }
        
        require(dailyBridged[user] + amount <= MAX_DAILY_LIMIT, "Daily limit exceeded");
        dailyBridged[user] += amount;
    }
    
    function _verifySignatures(
        bytes32 messageHash,
        bytes[] calldata signatures
    ) internal view returns (bool) {
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        
        address[] memory signers = new address[](signatures.length);
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = _recoverSigner(messageHash, signatures[i]);
            require(relayers[signer], "Invalid relayer");
            
            // Check for duplicates
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signer");
            }
            signers[i] = signer;
        }
        
        return true;
    }
    
    function _recoverSigner(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (address) {
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);
        return ecrecover(ethSignedHash, v, r, s);
    }
    
    function _splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
    
    // ============ View Functions ============
    
    function getRemainingDailyLimit(address user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        
        if (lastBridgeDay[user] < today) {
            return MAX_DAILY_LIMIT;
        }
        
        if (dailyBridged[user] >= MAX_DAILY_LIMIT) {
            return 0;
        }
        
        return MAX_DAILY_LIMIT - dailyBridged[user];
    }
    
    function calculateFee(uint256 amount) external pure returns (uint256) {
        return (amount * BRIDGE_FEE) / FEE_DENOMINATOR;
    }
}
```

---

### Selendra Bridge Contract (Substrate Pallet or EVM)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract SelendraBridgeNative is ReentrancyGuard, Pausable {
    
    // ============ Constants ============
    
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant BRIDGE_FEE = 50;          // 0.50%
    uint256 public constant BURN_PORTION = 50;        // 50% of fee burned
    uint256 public constant MIN_BRIDGE_AMOUNT = 10000 * 1e18;  // 10,000 SEL
    uint256 public constant MAX_DAILY_LIMIT = 1000000 * 1e18;  // 1M SEL per wallet
    uint256 public constant MINT_DELAY = 15 minutes;
    
    // ============ State ============
    
    address public treasury;
    
    mapping(address => bool) public relayers;
    uint256 public requiredSignatures;
    
    mapping(bytes32 => bool) public processedMints;
    mapping(bytes32 => MintRequest) public pendingMints;
    
    mapping(address => uint256) public dailyBridged;
    mapping(address => uint256) public lastBridgeDay;
    
    uint256 public totalMinted;
    uint256 public totalBurned;
    
    struct MintRequest {
        address to;
        uint256 amount;
        uint256 unlockTime;
        bool completed;
    }
    
    // ============ Events ============
    
    event BurnForBridge(
        address indexed from,
        bytes32 indexed burnId,
        uint256 amount,
        uint256 fee,
        string bscAddress,
        uint256 timestamp
    );
    
    event MintInitiated(
        address indexed to,
        bytes32 indexed mintId,
        uint256 amount,
        uint256 unlockTime
    );
    
    event MintCompleted(
        address indexed to,
        bytes32 indexed mintId,
        uint256 amount
    );
    
    // ============ Constructor ============
    
    constructor(
        address _treasury,
        address[] memory _initialRelayers,
        uint256 _requiredSignatures
    ) {
        treasury = _treasury;
        requiredSignatures = _requiredSignatures;
        
        for (uint256 i = 0; i < _initialRelayers.length; i++) {
            relayers[_initialRelayers[i]] = true;
        }
    }
    
    // ============ Bridge: Selendra → BSC ============
    
    function burnForBridge(
        string calldata bscAddress
    ) external payable nonReentrant whenNotPaused returns (bytes32 burnId) {
        uint256 amount = msg.value;
        require(amount >= MIN_BRIDGE_AMOUNT, "Amount too small");
        require(bytes(bscAddress).length == 42, "Invalid BSC address");
        
        // Check daily limit
        _checkDailyLimit(msg.sender, amount);
        
        // Calculate fee
        uint256 fee = (amount * BRIDGE_FEE) / FEE_DENOMINATOR;
        uint256 burnAmount = (fee * BURN_PORTION) / 100;
        uint256 treasuryAmount = fee - burnAmount;
        uint256 netAmount = amount - fee;
        
        // Burn the net amount (send to zero address or use native burn)
        // The fee portion goes to treasury
        payable(treasury).transfer(treasuryAmount);
        // burnAmount is implicitly burned by not transferring anywhere
        
        totalBurned += netAmount + burnAmount;
        
        // Generate burn ID
        burnId = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            bscAddress,
            block.number,
            block.timestamp
        ));
        
        emit BurnForBridge(msg.sender, burnId, netAmount, fee, bscAddress, block.timestamp);
    }
    
    // ============ Bridge: BSC → Selendra ============
    
    function initiateMint(
        address to,
        uint256 amount,
        bytes32 bscTransactionHash,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused returns (bytes32 mintId) {
        require(_verifySignatures(bscTransactionHash, signatures), "Invalid signatures");
        require(!processedMints[bscTransactionHash], "Already processed");
        
        // Calculate fee
        uint256 fee = (amount * BRIDGE_FEE) / FEE_DENOMINATOR;
        uint256 netAmount = amount - fee;
        
        mintId = bscTransactionHash;
        pendingMints[mintId] = MintRequest({
            to: to,
            amount: netAmount,
            unlockTime: block.timestamp + MINT_DELAY,
            completed: false
        });
        processedMints[mintId] = true;
        
        emit MintInitiated(to, mintId, netAmount, pendingMints[mintId].unlockTime);
    }
    
    function completeMint(bytes32 mintId) external nonReentrant whenNotPaused {
        MintRequest storage request = pendingMints[mintId];
        require(request.amount > 0, "Mint not initiated");
        require(!request.completed, "Already completed");
        require(block.timestamp >= request.unlockTime, "Mint delay not passed");
        
        request.completed = true;
        totalMinted += request.amount;
        
        // Mint native SEL to recipient
        // This would call the native token minting mechanism
        payable(request.to).transfer(request.amount);
        
        emit MintCompleted(request.to, mintId, request.amount);
    }
    
    // ============ Internal ============
    
    function _checkDailyLimit(address user, uint256 amount) internal {
        uint256 today = block.timestamp / 1 days;
        
        if (lastBridgeDay[user] < today) {
            dailyBridged[user] = 0;
            lastBridgeDay[user] = today;
        }
        
        require(dailyBridged[user] + amount <= MAX_DAILY_LIMIT, "Daily limit exceeded");
        dailyBridged[user] += amount;
    }
    
    function _verifySignatures(
        bytes32 messageHash,
        bytes[] calldata signatures
    ) internal view returns (bool) {
        require(signatures.length >= requiredSignatures, "Insufficient signatures");
        
        address[] memory signers = new address[](signatures.length);
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = _recoverSigner(messageHash, signatures[i]);
            require(relayers[signer], "Invalid relayer");
            
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signer");
            }
            signers[i] = signer;
        }
        
        return true;
    }
    
    function _recoverSigner(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (address) {
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);
        return ecrecover(ethSignedHash, v, r, s);
    }
    
    function _splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
    
    // ============ Receive ============
    
    receive() external payable {
        // Accept SEL for minting
    }
}
```

---

## Relayer Network

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RELAYER NETWORK                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Relayer  │  │ Relayer  │  │ Relayer  │  │ Relayer  │            │
│  │    1     │  │    2     │  │    3     │  │    4     │  ...       │
│  │(Selendra)│  │(Partner) │  │(Partner) │  │(Partner) │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │             │                    │
│       └─────────────┼─────────────┼─────────────┘                    │
│                     │             │                                  │
│                     ▼             ▼                                  │
│              ┌─────────────────────────┐                            │
│              │     Multi-Sig Check     │                            │
│              │     (3 of 5 required)   │                            │
│              └─────────────────────────┘                            │
│                          │                                          │
│                          ▼                                          │
│              ┌─────────────────────────┐                            │
│              │   Execute Bridge Tx     │                            │
│              └─────────────────────────┘                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Relayer Requirements

| Requirement | Value |
|-------------|-------|
| Minimum stake | 100,000 SEL |
| Uptime SLA | 99.9% |
| Response time | < 30 seconds |
| Slashing | 10% for malicious behavior |

### Relayer Selection

```
Initial Relayers (5):
├── Selendra Foundation (1)
├── Validator Partners (2)
└── Community Elected (2)

Expansion Plan:
├── Year 1: 5 relayers
├── Year 2: 10 relayers
└── Year 3+: Fully decentralized
```

---

## Fee Structure

### Bridge Fees (0.50%)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User bridges 100,000 SEL                                   │
│                                                             │
│  Bridge Fee: 100,000 × 0.50% = 500 SEL                      │
│                                                             │
│  Distribution:                                              │
│  ├── 250 SEL (50%) → BURNED 🔥                              │
│  └── 250 SEL (50%) → Treasury                               │
│                                                             │
│  User receives: 99,500 SEL on destination chain             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Anti-Dump Economics

| Amount | Fee | Time | Gas | Total Cost | Worth It? |
|--------|-----|------|-----|------------|-----------|
| 10,000 SEL ($25) | $0.125 | 15 min | ~$2 | ~$2.13 | ❌ 8.5% cost |
| 50,000 SEL ($125) | $0.625 | 15 min | ~$2 | ~$2.63 | ⚠️ 2.1% cost |
| 100,000 SEL ($250) | $1.25 | 15 min | ~$2 | ~$3.25 | ✅ 1.3% cost |
| 1,000,000 SEL ($2,500) | $12.50 | 15 min | ~$2 | ~$14.50 | ✅ 0.6% cost |

**Result**: Small holders won't bridge to dump; only serious users.

---

## Security Measures

### 1. Multi-Signature

```
- 5 relayers total
- 3 signatures required (60%)
- Geographically distributed
- Different key management systems
```

### 2. Time Delays

```
BSC → Selendra: 15 minutes
Selendra → BSC: 15 minutes

Purpose:
├── Allows monitoring for suspicious activity
├── Enables emergency pause
└── Prevents flash attacks
```

### 3. Rate Limiting

```
Per Wallet:
├── Daily limit: 1,000,000 SEL
├── Cooldown between bridges: 1 minute
└── Max pending: 3 transactions

Global:
├── Hourly limit: 10,000,000 SEL
├── Emergency pause threshold: 50,000,000 SEL/hour
└── Circuit breaker: Auto-pause on anomaly
```

### 4. Emergency Controls

```solidity
// Emergency pause
function pause() external onlyRelayer {
    require(relayerVotes[msg.sender] == false, "Already voted");
    relayerVotes[msg.sender] = true;
    pauseVotes++;
    
    if (pauseVotes >= requiredSignatures) {
        _pause();
        emit EmergencyPause(msg.sender);
    }
}

// Emergency withdraw (requires all relayers)
function emergencyWithdraw(
    address to,
    uint256 amount,
    bytes[] calldata signatures
) external whenPaused {
    require(signatures.length == totalRelayers, "All relayers required");
    require(_verifySignatures(keccak256(abi.encode(to, amount)), signatures));
    
    selToken.transfer(to, amount);
    emit EmergencyWithdraw(to, amount);
}
```

---

## User Flow

### BSC → Selendra

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. User connects wallet to Bridge UI                       │
│     └── Supports MetaMask, WalletConnect                    │
│                                                             │
│  2. User enters amount (min 10,000 SEL)                     │
│     └── UI shows fee breakdown                              │
│                                                             │
│  3. User enters Selendra address                            │
│     └── Validates SS58 format                               │
│                                                             │
│  4. User approves SEL spending                              │
│     └── One-time approval for bridge contract               │
│                                                             │
│  5. User confirms deposit                                   │
│     └── Transaction sent to BSC                             │
│                                                             │
│  6. Wait for confirmations (15 blocks, ~45 seconds)         │
│     └── Progress bar shown in UI                            │
│                                                             │
│  7. Relayers detect and attest                              │
│     └── 3 of 5 must sign                                    │
│                                                             │
│  8. Wait for delay (15 minutes)                             │
│     └── Countdown shown in UI                               │
│                                                             │
│  9. SEL minted on Selendra                                  │
│     └── User notified, can verify on explorer               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Selendra → BSC

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. User connects Selendra wallet                           │
│     └── Supports Polkadot.js, SubWallet                     │
│                                                             │
│  2. User enters amount (min 10,000 SEL)                     │
│     └── Must have SEL for gas                               │
│                                                             │
│  3. User enters BSC address                                 │
│     └── Validates 0x format                                 │
│                                                             │
│  4. User confirms burn                                      │
│     └── SEL burned on Selendra                              │
│                                                             │
│  5. Wait for finality                                       │
│     └── ~6 seconds on Selendra                              │
│                                                             │
│  6. Relayers detect and attest                              │
│     └── 3 of 5 must sign                                    │
│                                                             │
│  7. Release initiated on BSC                                │
│     └── Gas paid by relayer, recovered from fee             │
│                                                             │
│  8. Wait for delay (15 minutes)                             │
│     └── Countdown shown in UI                               │
│                                                             │
│  9. User claims SEL on BSC                                  │
│     └── Or auto-claimed by relayer                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Contract Addresses (Planned)

| Contract | Chain | Address | Status |
|----------|-------|---------|--------|
| Bridge | BSC | `0x...` | Pending |
| Bridge | Selendra | `0x...` or Pallet | Pending |
| SEL Token | BSC | `0x...` | Existing |
| Treasury | BSC | `0x...` | Pending |
| Treasury | Selendra | `sel1...` | Pending |
| Burn | Both | `0x...dead` | Standard |

---

## Monitoring & Alerts

### Metrics to Track

```
Real-time:
├── Bridge TVL (locked on BSC)
├── Pending transactions
├── Relayer health
└── Fee revenue

Alerts:
├── Large bridge (>100,000 SEL)
├── Relayer offline
├── Unusual volume spike
└── Failed transactions
```

### Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  SELENDRA BRIDGE MONITOR                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TVL Locked: 5,234,567 SEL ($13,086)                        │
│  24h Volume: 234,567 SEL ($586)                             │
│  Pending Tx: 3                                               │
│  Relayers: 5/5 Online ✅                                    │
│                                                              │
│  Recent Bridges:                                             │
│  ├── 50,000 SEL → Selendra (2 min ago) ✅                   │
│  ├── 100,000 SEL → BSC (15 min ago) ⏳                      │
│  └── 25,000 SEL → Selendra (1 hour ago) ✅                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Timeline

| Week | Milestone |
|------|-----------|
| 1-2 | BSC Bridge Contract |
| 2-3 | Selendra Bridge (Pallet or EVM) |
| 3-4 | Relayer software |
| 4-5 | Frontend integration |
| 5-6 | Testnet testing |
| 6-7 | Audit |
| 8 | **Mainnet Launch** 🚀 |

---

## Document Info

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Date | November 30, 2025 |
| Author | Selendra Core Team |
| Status | Draft |

---

*Bridge design prioritizes security and anti-dump friction over speed.*
