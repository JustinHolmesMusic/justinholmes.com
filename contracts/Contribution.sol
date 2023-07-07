// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Contribution {
    address payable public immutable owner;
    address payable public immutable beneficiary;
    uint public totalContributed;
    bool public materialReleased;
    uint256 public countdownPeriod;
    uint256 public threshold;

    mapping(address => uint256) public contributors;
    mapping(address => bool) public contributorsBeforeReveal;

    event Contribution(address indexed contributor, uint256 amount);
    event FundsReleased();
    event Sweep();

    constructor(
        uint256 countdownPeriod,
        uint256 _threshold,
        address payable _beneficiary
    ) {
        owner = payable(msg.sender);
        countdownPeriod = countdownPeriod;
        threshold = _threshold;
        beneficiary = _beneficiary;
    }

    function contribute() external payable {
        totalContributed += msg.value;
        contributors[msg.sender] += msg.value;

        // Flag contributors who have contributed before the threshold is met
        if (totalContributed - msg.value < threshold) {
            contributorsBeforeReveal[msg.sender] = true;
        }

        // This is "contribution-revealer logic"
        if (totalContributed >= threshold) {
            // Mark the material as released
            materialReleased = true;
        }

        // This is domain-specific logic....?
        if (materialReleased) {
            // Reset the countdown period
            countdownPeriod = block.timestamp + countdownPeriod;
        }

        emit Contribution(msg.sender, msg.value);
    }

    receive() external payable {
        emit Contribution(msg.sender, msg.value);
    }

    function withdraw() external {
        require(msg.sender == beneficiary, "Only the beneficiary can withdraw funds");
        require(materialReleased, "Funds have not yet been released");
        beneficiary.transfer(address(this).balance);
        emit Sweep();
    }

    function contributedAfterThreshold(address _contributor) external view returns (bool) {
        return contributors[_contributor] > 0 && !contributorsBeforeReveal[_contributor];
    }
}
