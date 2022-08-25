// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.4;

contract Faucet {
  address payable public owner;

  constructor() payable {
    owner = payable(msg.sender);
  }

  event FallbackCalled(address);

  function withdraw(uint _amount) payable public {
    // users can only withdraw .1 eth at a time
    require(_amount <= 100000000000000000);
    payable(msg.sender).transfer(_amount);
  }

  function withdrawAll() onlyOwner public {
    owner.transfer(address(this).balance);
  }

  function destroyFaucet() onlyOwner public {
    selfdestruct(owner);
  }

  // function will be invoked if msg contains no matching calldata
  fallback() external payable {
    emit FallbackCalled(msg.sender);
  }

  // default receiver function
  receive() external payable {}

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }
}