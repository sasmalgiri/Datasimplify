/**
 * Smart Contract Example Code API
 * Returns example Solidity code for testing the verifier
 */

import { NextResponse } from 'next/server';

const EXAMPLE_CODES = {
  simple: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleToken {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 amount);

    function mint(uint256 amount) public {
        balances[msg.sender] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(to != address(0), "Invalid recipient");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
}`,

  vulnerable: `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

// WARNING: This contract has intentional vulnerabilities for testing
contract VulnerableToken {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // VULNERABLE: No overflow protection in Solidity < 0.8
    function unsafeAdd(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }

    // VULNERABLE: Reentrancy - external call before state update
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] -= amount;  // State update after external call!
    }

    // VULNERABLE: Division without zero check
    function divide(uint256 a, uint256 b) public pure returns (uint256) {
        return a / b;
    }
}`,

  defi: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleLending is ReentrancyGuard {
    IERC20 public token;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrows;

    uint256 public constant COLLATERAL_RATIO = 150; // 150%

    constructor(address _token) {
        token = IERC20(_token);
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        deposits[msg.sender] += amount;
    }

    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        uint256 collateralValue = deposits[msg.sender];
        uint256 maxBorrow = (collateralValue * 100) / COLLATERAL_RATIO;

        require(borrows[msg.sender] + amount <= maxBorrow, "Exceeds borrow limit");

        borrows[msg.sender] += amount;
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }

    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(amount <= borrows[msg.sender], "Repay exceeds debt");

        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        borrows[msg.sender] -= amount;
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        require(amount <= deposits[msg.sender], "Exceeds deposit");

        // Check if withdrawal maintains collateral ratio
        uint256 remainingCollateral = deposits[msg.sender] - amount;
        uint256 requiredCollateral = (borrows[msg.sender] * COLLATERAL_RATIO) / 100;
        require(remainingCollateral >= requiredCollateral, "Would under-collateralize");

        deposits[msg.sender] -= amount;
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }
}`,

  nft: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SimpleNFT is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PRICE = 0.05 ether;

    string private _baseTokenURI;

    constructor() ERC721("SimpleNFT", "SNFT") {}

    function mint() external payable {
        require(_tokenIds.current() < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= MINT_PRICE, "Insufficient payment");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);

        // Refund excess payment
        if (msg.value > MINT_PRICE) {
            uint256 refund = msg.value - MINT_PRICE;
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}`
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'simple';

  const code = EXAMPLE_CODES[type as keyof typeof EXAMPLE_CODES] || EXAMPLE_CODES.simple;

  return NextResponse.json({
    success: true,
    type,
    code,
    availableTypes: Object.keys(EXAMPLE_CODES)
  });
}
