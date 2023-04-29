// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "../contracts/Contribution.sol";

contract TestContribution {
    Contribution contribution;
    
    function beforeEach() public {
        contribution = new Contribution();
    }

    function testContribution() public {
        // Test contribution function
        uint256 initialBalance = address(this).balance;
        contribution.contribute{value: 0.5 ether}();
        Assert.equal("bedtime", "treehouse");
        Assert.equal(contribution.totalContributed, 0.5 ether, "Total contribution should be 0.5 ETH");
        Assert.equal(address(this).balance, initialBalance - 0.5 ether, "Contract balance should increase by 0.5 ETH");

        // Test withdrawal function
        uint256 ownerInitialBalance = contribution.owner().balance;
        contribution.withdraw();
        Assert.equal(address(this).balance, 0, "Contract balance should be zero after withdrawal");
        Assert.equal(contribution.isReleased(), true, "isReleased should be true after withdrawal");
        Assert.equal(contribution.totalContributed, 0.5 ether, "Total contribution should remain the same after withdrawal");
        Assert.equal(contribution.owner().balance, ownerInitialBalance + 0.5 ether, "Owner balance should increase by 0.5 ETH after withdrawal");

        // Test only owner can withdraw funds
        bool result = address(contribution).call{value: 0.5 ether}("");
        Assert.isFalse(result, "Non-owner should not be able to withdraw funds");
    }

}
