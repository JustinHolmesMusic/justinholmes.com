// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UnlockableToken is ERC20 {
    address public unlockAccount;
    bool public unlocked = false;
    uint256 public unlockTime;
    uint256 public unlockAmount;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply,
        address initialHolder,
        address unlockAccount_,
        uint256 unlockTime_,
        uint256 unlockAmount_
    ) ERC20(name, symbol) {
        _setupDecimals(decimals);
        _mint(initialHolder, initialSupply);
        unlockAccount = unlockAccount_;
        unlockTime = unlockTime_;
        unlockAmount = unlockAmount_;
    }

    function unlock() external {
        require(!unlocked, "Tokens have already been unlocked");
        require(msg.sender == unlockAccount, "Not authorized to unlock tokens");
        require(block.timestamp >= unlockTime, "Unlock time has not yet arrived");

        _mint(unlockAccount, unlockAmount);
        unlocked = true;
    }
}
