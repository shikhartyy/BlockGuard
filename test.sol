pragma solidity ^0.8.0;

contract Test {
    function withdraw() public {
        msg.sender.call("");
    }
}
