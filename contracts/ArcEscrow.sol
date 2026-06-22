// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

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
        Status status;
    }

    IERC20 public immutable usdc;
    address public immutable operator;
    mapping(bytes32 => Milestone) public milestones;

    event MilestoneFunded(bytes32 indexed id, address indexed buyer, address indexed seller, uint256 amount);
    event MilestoneSubmitted(bytes32 indexed id);
    event MilestoneDisputed(bytes32 indexed id);
    event MilestoneReleased(bytes32 indexed id, address indexed seller, uint256 amount);
    event MilestoneRefunded(bytes32 indexed id, address indexed buyer, uint256 amount);

    modifier onlyOperator() {
        require(msg.sender == operator, "operator only");
        _;
    }

    constructor(address usdcAddress, address operatorAddress) {
        require(usdcAddress != address(0) && operatorAddress != address(0), "zero address");
        usdc = IERC20(usdcAddress);
        operator = operatorAddress;
    }

    function fundMilestone(bytes32 id, address seller, uint256 amount) external {
        require(milestones[id].amount == 0, "already funded");
        require(seller != address(0) && amount > 0, "invalid milestone");
        require(usdc.transferFrom(msg.sender, address(this), amount), "funding failed");
        milestones[id] = Milestone(msg.sender, seller, amount, Status.Funded);
        emit MilestoneFunded(id, msg.sender, seller, amount);
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

    function releaseMilestone(bytes32 id) external onlyOperator {
        Milestone storage item = milestones[id];
        require(item.status == Status.Submitted || item.status == Status.Disputed, "not releasable");
        item.status = Status.Released;
        require(usdc.transfer(item.seller, item.amount), "transfer failed");
        emit MilestoneReleased(id, item.seller, item.amount);
    }

    function refundMilestone(bytes32 id) external onlyOperator {
        Milestone storage item = milestones[id];
        require(item.status == Status.Funded || item.status == Status.Submitted || item.status == Status.Disputed, "not refundable");
        item.status = Status.Refunded;
        require(usdc.transfer(item.buyer, item.amount), "transfer failed");
        emit MilestoneRefunded(id, item.buyer, item.amount);
    }
}
