// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Contribution {
    address payable public immutable owner;
    uint public totalContributed;
    bool public isReleased;

    constructor() {
        owner = payable(msg.sender);
    }

    function contribute() external payable {
        require(msg.value >= 0.1 ether, "Contribution must be at least 0.1 ETH");
        totalContributed += msg.value;

        if (totalContributed >= 10 ether) {
            isReleased = true;
        }
    }

    function withdraw() external {
        require(msg.sender == owner, "Only the contract owner can withdraw funds");
        require(isReleased, "Funds have not yet been released");

        owner.transfer(address(this).balance);
    }
}