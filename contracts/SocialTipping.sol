// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SocialTipping is ReentrancyGuard {
    // Struct to store creator information
    struct Creator {
        address payable walletAddress;
        string name;
        string description;
        uint256 totalTips;
        bool isRegistered;
    }

    // Mapping from creator address to Creator struct
    mapping(address => Creator) public creators;
    // Array to store all creator addresses
    address[] public creatorAddresses;

    // Events
    event CreatorRegistered(address indexed creator, string name);
    event TipSent(address indexed from, address indexed to, uint256 amount);

    // Register as a content creator
    function registerCreator(string memory _name, string memory _description) external {
        require(!creators[msg.sender].isRegistered, "Creator already registered");
        
        creators[msg.sender] = Creator({
            walletAddress: payable(msg.sender),
            name: _name,
            description: _description,
            totalTips: 0,
            isRegistered: true
        });
        
        creatorAddresses.push(msg.sender);
        emit CreatorRegistered(msg.sender, _name);
    }

    // Send tip to a creator in ETH
    function tipCreator(address _creator) external payable nonReentrant {
        require(creators[_creator].isRegistered, "Creator not registered");
        require(msg.value > 0, "Tip amount must be greater than 0");

        creators[_creator].totalTips += msg.value;
        creators[_creator].walletAddress.transfer(msg.value);
        
        emit TipSent(msg.sender, _creator, msg.value);
    }

    // Get all creators
    function getAllCreators() external view returns (Creator[] memory) {
        Creator[] memory allCreators = new Creator[](creatorAddresses.length);
        
        for (uint i = 0; i < creatorAddresses.length; i++) {
            allCreators[i] = creators[creatorAddresses[i]];
        }
        
        return allCreators;
    }

    // Get creator details
    function getCreator(address _creator) external view returns (Creator memory) {
        return creators[_creator];
    }
} 