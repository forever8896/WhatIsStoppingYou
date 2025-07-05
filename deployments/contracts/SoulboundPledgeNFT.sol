// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract SoulboundPledgeNFT is ERC721, Ownable {
    using Strings for uint256;

    struct PledgeNFT {
        uint256 campaignId;
        uint256 pledgeAmount;
        uint256 timestamp;
        address pledger;
        string campaignTitle;
    }

    mapping(uint256 => PledgeNFT) public pledgeNFTs;
    mapping(address => uint256[]) public userNFTs;
    
    uint256 public tokenCounter;
    address public pledgeContract;

    event SoulboundNFTMinted(
        uint256 indexed tokenId,
        address indexed pledger,
        uint256 indexed campaignId,
        uint256 pledgeAmount
    );

    constructor(address _pledgeContract) ERC721("SoulboundPledgeNFT", "SPNFT") Ownable(msg.sender) {
        pledgeContract = _pledgeContract;
        tokenCounter = 0;
    }

    modifier onlyPledgeContract() {
        require(msg.sender == pledgeContract, "Only pledge contract can mint");
        _;
    }

    function mintPledgeSBT(
        address _to,
        uint256 _campaignId,
        uint256 _pledgeAmount,
        string memory _campaignTitle
    ) external onlyPledgeContract returns (uint256) {
        uint256 tokenId = tokenCounter++;
        
        pledgeNFTs[tokenId] = PledgeNFT({
            campaignId: _campaignId,
            pledgeAmount: _pledgeAmount,
            timestamp: block.timestamp,
            pledger: _to,
            campaignTitle: _campaignTitle
        });

        userNFTs[_to].push(tokenId);
        _safeMint(_to, tokenId);

        emit SoulboundNFTMinted(tokenId, _to, _campaignId, _pledgeAmount);
        return tokenId;
    }

    // Override transfer functions to make tokens soulbound
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: Transfer not allowed");
        }
        
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert("Soulbound: Approval not allowed");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("Soulbound: Approval not allowed");
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        PledgeNFT memory nft = pledgeNFTs[tokenId];
        
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Pledge #',
                        tokenId.toString(),
                        '", "description": "Soulbound NFT representing a pledge to campaign: ',
                        nft.campaignTitle,
                        '", "attributes": [',
                        '{"trait_type": "Campaign ID", "value": "',
                        nft.campaignId.toString(),
                        '"},',
                        '{"trait_type": "Pledge Amount", "value": "',
                        (nft.pledgeAmount / 1e18).toString(),
                        ' RON"},',
                        '{"trait_type": "Pledge Date", "value": "',
                        nft.timestamp.toString(),
                        '"},',
                        '{"trait_type": "Campaign Title", "value": "',
                        nft.campaignTitle,
                        '"}',
                        '], "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(generateSVG(tokenId))),
                        '"}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function generateSVG(uint256 tokenId) internal view returns (string memory) {
        PledgeNFT memory nft = pledgeNFTs[tokenId];
        
        return string(
            abi.encodePacked(
                '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
                '<defs>',
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />',
                '<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />',
                '</linearGradient>',
                '</defs>',
                '<rect width="400" height="400" fill="url(#bg)"/>',
                '<text x="200" y="50" text-anchor="middle" fill="white" font-size="24" font-weight="bold">Pledge NFT</text>',
                '<text x="200" y="100" text-anchor="middle" fill="white" font-size="18">#',
                tokenId.toString(),
                '</text>',
                '<text x="200" y="150" text-anchor="middle" fill="white" font-size="16">Campaign: ',
                nft.campaignTitle,
                '</text>',
                '<text x="200" y="200" text-anchor="middle" fill="white" font-size="20">',
                (nft.pledgeAmount / 1e18).toString(),
                ' RON</text>',
                '<text x="200" y="250" text-anchor="middle" fill="white" font-size="14">Pledged on</text>',
                '<text x="200" y="280" text-anchor="middle" fill="white" font-size="14">',
                formatTimestamp(nft.timestamp),
                '</text>',
                '<text x="200" y="350" text-anchor="middle" fill="white" font-size="12" opacity="0.8">Soulbound - Non-transferable</text>',
                '</svg>'
            )
        );
    }

    function formatTimestamp(uint256 timestamp) internal pure returns (string memory) {
        // Simple timestamp formatting - in production you'd want a proper date library
        return string(abi.encodePacked("Block: ", timestamp.toString()));
    }

    function getUserNFTs(address _user) external view returns (uint256[] memory) {
        return userNFTs[_user];
    }

    function getPledgeNFT(uint256 _tokenId) external view returns (PledgeNFT memory) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        return pledgeNFTs[_tokenId];
    }

    function getTotalPledgedByUser(address _user) external view returns (uint256) {
        uint256[] memory nfts = userNFTs[_user];
        uint256 total = 0;
        
        for (uint256 i = 0; i < nfts.length; i++) {
            total += pledgeNFTs[nfts[i]].pledgeAmount;
        }
        
        return total;
    }

    // Admin functions
    function setPledgeContract(address _pledgeContract) external onlyOwner {
        pledgeContract = _pledgeContract;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 