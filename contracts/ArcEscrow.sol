// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// NOTE: These changes affect NEW deployments only. The currently configured
// ARC_ESCROW_CONTRACT_ADDRESS points at the previously deployed bytecode and is
// unchanged until this source is redeployed via Circle Contracts. After redeploy,
// whoever funds a milestone must use the new fundMilestone signature (it now takes
// a refundWindow), and ARC_ESCROW_CONTRACT_ADDRESS must be updated to the new address.
//
// Operator-centralization mitigation: each milestone carries a refund deadline set
// at funding time. Before the deadline only the operator can release/refund (normal
// flow). After the deadline the buyer can self-recover funds via claimRefund WITHOUT
// the operator — so a lost/unavailable operator key can no longer freeze funds
// permanently. The seller sees refundableAt (emitted at funding) before submitting
// work, so the window is an agreed term, not a surprise.

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ArcEscrow {
    enum Status { Funded, Submitted, Disputed, Released, Refunded }

    struct Milestone {
        address buyer;
        address seller;
        uint256 amount;
        uint64 refundableAt;
        Status status;
    }

    // Floor on the buyer refund window so the operator always has time to act in the
    // normal flow before the buyer can self-refund. Deployments that need a longer
    // guarantee (production) should pass a larger window per milestone.
    uint64 public constant MIN_REFUND_WINDOW = 1 hours;

    IERC20 public immutable usdc;
    address public immutable operator;
    mapping(bytes32 => Milestone) public milestones;

    uint256 private _lock = 1;

    event MilestoneFunded(bytes32 indexed id, address indexed buyer, address indexed seller, uint256 amount, uint64 refundableAt);
    event MilestoneSubmitted(bytes32 indexed id);
    event MilestoneDisputed(bytes32 indexed id);
    event MilestoneReleased(bytes32 indexed id, address indexed seller, uint256 amount);
    event MilestoneRefunded(bytes32 indexed id, address indexed buyer, uint256 amount);

    modifier onlyOperator() {
        require(msg.sender == operator, "operator only");
        _;
    }

    modifier nonReentrant() {
        require(_lock == 1, "reentrant");
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor(address usdcAddress, address operatorAddress) {
        require(usdcAddress != address(0) && operatorAddress != address(0), "zero address");
        usdc = IERC20(usdcAddress);
        operator = operatorAddress;
    }

    function fundMilestone(bytes32 id, address seller, uint256 amount, uint64 refundWindow) external nonReentrant {
        require(milestones[id].amount == 0, "already funded");
        require(seller != address(0) && amount > 0, "invalid milestone");
        require(refundWindow >= MIN_REFUND_WINDOW, "refund window too short");
        uint64 refundableAt = uint64(block.timestamp) + refundWindow;
        // Effect before interaction where possible; nonReentrant also blocks any
        // token-callback reentry from double-funding the same id.
        milestones[id] = Milestone(msg.sender, seller, amount, refundableAt, Status.Funded);
        _safeTransferFrom(msg.sender, address(this), amount, "funding failed");
        emit MilestoneFunded(id, msg.sender, seller, amount, refundableAt);
    }

    function submitMilestone(bytes32 id) external {
        Milestone storage item = milestones[id];
        require(msg.sender == item.seller, "seller only");
        require(item.status == Status.Funded, "not funded");
        item.status = Status.Submitted;
        emit MilestoneSubmitted(id);
    }

    function disputeMilestone(bytes32 id) external {
        Milestone storage item = milestones[id];
        require(msg.sender == item.buyer || msg.sender == item.seller, "party only");
        require(item.status == Status.Funded || item.status == Status.Submitted, "not disputable");
        item.status = Status.Disputed;
        emit MilestoneDisputed(id);
    }

    function releaseMilestone(bytes32 id) external onlyOperator nonReentrant {
        Milestone storage item = milestones[id];
        require(item.amount > 0, "unknown milestone");
        require(item.status == Status.Submitted || item.status == Status.Disputed, "not releasable");
        item.status = Status.Released;
        _safeTransfer(item.seller, item.amount, "transfer failed");
        emit MilestoneReleased(id, item.seller, item.amount);
    }

    function refundMilestone(bytes32 id) external onlyOperator nonReentrant {
        Milestone storage item = milestones[id];
        require(item.amount > 0, "unknown milestone");
        require(item.status == Status.Funded || item.status == Status.Submitted || item.status == Status.Disputed, "not refundable");
        item.status = Status.Refunded;
        _safeTransfer(item.buyer, item.amount, "transfer failed");
        emit MilestoneRefunded(id, item.buyer, item.amount);
    }

    // Operator-independent fallback: once the refund deadline has passed, the buyer can
    // recover their own funds even if the operator never acts. Callable only by the
    // buyer, only after refundableAt, and only while the milestone is not yet terminal.
    function claimRefund(bytes32 id) external nonReentrant {
        Milestone storage item = milestones[id];
        require(item.amount > 0, "unknown milestone");
        require(msg.sender == item.buyer, "buyer only");
        require(block.timestamp >= item.refundableAt, "refund window not reached");
        require(item.status == Status.Funded || item.status == Status.Submitted || item.status == Status.Disputed, "not refundable");
        item.status = Status.Refunded;
        _safeTransfer(item.buyer, item.amount, "transfer failed");
        emit MilestoneRefunded(id, item.buyer, item.amount);
    }

    // Handles USDC-style tokens that return a bool as well as non-standard tokens
    // that return no data, and reverts on a false return — safer than a raw
    // `require(token.transfer(...))` against an unknown token implementation.
    function _safeTransfer(address to, uint256 amount, string memory errorMessage) private {
        (bool ok, bytes memory data) = address(usdc).call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        require(ok && (data.length == 0 || abi.decode(data, (bool))), errorMessage);
    }

    function _safeTransferFrom(address from, address to, uint256 amount, string memory errorMessage) private {
        (bool ok, bytes memory data) = address(usdc).call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount));
        require(ok && (data.length == 0 || abi.decode(data, (bool))), errorMessage);
    }
}
