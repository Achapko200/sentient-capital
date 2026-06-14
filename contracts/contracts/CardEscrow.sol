// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─── CardEscrow.sol ───────────────────────────────────────────────────────────
// Escrow contract for baseball card marketplace on Arc testnet.
// Buyer deposits USDC → held in escrow → released to seller on confirmation
// or refunded to buyer if seller doesn't confirm within 7 days.

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CardEscrow {

    // ── Types ────────────────────────────────────────────────────────────────

    enum State { AWAITING_PAYMENT, FUNDED, SHIPPED, COMPLETE, REFUNDED, DISPUTED }

    struct Trade {
        address buyer;
        address seller;
        uint256 amountUSDC;   // in USDC units (6 decimals)
        string  cardName;
        string  listingId;
        uint256 fundedAt;
        uint256 deadline;     // seller must confirm shipment by this time
        State   state;
        string  txNote;       // optional note (tracking number, etc.)
    }

    // ── State ─────────────────────────────────────────────────────────────────

    IERC20  public immutable usdc;
    address public immutable platform;   // platform fee recipient
    uint256 public constant  FEE_BPS = 250; // 2.5% platform fee
    uint256 public constant  ESCROW_WINDOW = 7 days;

    uint256 public tradeCount;
    mapping(uint256 => Trade) public trades;

    // ── Events ────────────────────────────────────────────────────────────────

    event TradeFunded(uint256 indexed tradeId, address buyer, address seller, uint256 amount, string cardName);
    event TradeShipped(uint256 indexed tradeId, string txNote);
    event TradeComplete(uint256 indexed tradeId, uint256 sellerAmount, uint256 feeAmount);
    event TradeRefunded(uint256 indexed tradeId);
    event TradeDisputed(uint256 indexed tradeId);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _usdc, address _platform) {
        usdc     = IERC20(_usdc);
        platform = _platform;
    }

    // ── Buyer: create and fund trade ──────────────────────────────────────────

    function createTrade(
        address seller,
        uint256 amountUSDC,
        string calldata cardName,
        string calldata listingId
    ) external returns (uint256 tradeId) {
        require(seller != address(0),    "Invalid seller");
        require(seller != msg.sender,    "Cannot buy from yourself");
        require(amountUSDC > 0,          "Amount must be > 0");

        // Transfer USDC from buyer to this contract
        bool ok = usdc.transferFrom(msg.sender, address(this), amountUSDC);
        require(ok, "USDC transfer failed");

        tradeId = tradeCount++;

        trades[tradeId] = Trade({
            buyer:      msg.sender,
            seller:     seller,
            amountUSDC: amountUSDC,
            cardName:   cardName,
            listingId:  listingId,
            fundedAt:   block.timestamp,
            deadline:   block.timestamp + ESCROW_WINDOW,
            state:      State.FUNDED,
            txNote:     ""
        });

        emit TradeFunded(tradeId, msg.sender, seller, amountUSDC, cardName);
    }

    // ── Seller: confirm shipment ──────────────────────────────────────────────

    function confirmShipment(uint256 tradeId, string calldata txNote) external {
        Trade storage t = trades[tradeId];
        require(t.state == State.FUNDED,    "Trade not in FUNDED state");
        require(msg.sender == t.seller,     "Only seller can confirm");
        require(block.timestamp < t.deadline, "Escrow window expired");

        t.state  = State.SHIPPED;
        t.txNote = txNote;

        emit TradeShipped(tradeId, txNote);
    }

    // ── Buyer: confirm receipt → releases funds to seller ─────────────────────

    function confirmReceipt(uint256 tradeId) external {
        Trade storage t = trades[tradeId];
        require(t.state == State.SHIPPED,   "Card not yet marked shipped");
        require(msg.sender == t.buyer,      "Only buyer can confirm receipt");

        t.state = State.COMPLETE;

        _releaseFunds(tradeId);
    }

    // ── Buyer: auto-release after deadline if seller shipped ──────────────────

    function autoRelease(uint256 tradeId) external {
        Trade storage t = trades[tradeId];
        require(t.state == State.SHIPPED,             "Not in SHIPPED state");
        require(block.timestamp >= t.deadline + 3 days, "Wait 3 days after ship before auto-release");

        t.state = State.COMPLETE;
        _releaseFunds(tradeId);
    }

    // ── Buyer: refund if seller never confirmed shipment ──────────────────────

    function claimRefund(uint256 tradeId) external {
        Trade storage t = trades[tradeId];
        require(t.state == State.FUNDED,          "Not in FUNDED state");
        require(msg.sender == t.buyer,            "Only buyer can claim refund");
        require(block.timestamp >= t.deadline,    "Escrow window not expired yet");

        t.state = State.REFUNDED;

        bool ok = usdc.transfer(t.buyer, t.amountUSDC);
        require(ok, "Refund transfer failed");

        emit TradeRefunded(tradeId);
    }

    // ── Either party: open dispute ────────────────────────────────────────────

    function openDispute(uint256 tradeId) external {
        Trade storage t = trades[tradeId];
        require(
            t.state == State.FUNDED || t.state == State.SHIPPED,
            "Cannot dispute in current state"
        );
        require(
            msg.sender == t.buyer || msg.sender == t.seller,
            "Only trade parties can dispute"
        );

        t.state = State.DISPUTED;
        emit TradeDisputed(tradeId);
    }

    // ── Platform: resolve dispute ─────────────────────────────────────────────

    function resolveDispute(uint256 tradeId, bool favorBuyer) external {
        require(msg.sender == platform, "Only platform can resolve");
        Trade storage t = trades[tradeId];
        require(t.state == State.DISPUTED, "Not disputed");

        if (favorBuyer) {
            t.state = State.REFUNDED;
            usdc.transfer(t.buyer, t.amountUSDC);
            emit TradeRefunded(tradeId);
        } else {
            t.state = State.COMPLETE;
            _releaseFunds(tradeId);
        }
    }

    // ── Internal: release funds with platform fee ─────────────────────────────

    function _releaseFunds(uint256 tradeId) internal {
        Trade storage t = trades[tradeId];

        uint256 fee           = (t.amountUSDC * FEE_BPS) / 10000;
        uint256 sellerAmount  = t.amountUSDC - fee;

        usdc.transfer(t.seller,  sellerAmount);
        usdc.transfer(platform,  fee);

        emit TradeComplete(tradeId, sellerAmount, fee);
    }

    // ── View: get trade ───────────────────────────────────────────────────────

    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        return trades[tradeId];
    }

    function getTradeCount() external view returns (uint256) {
        return tradeCount;
    }
}
