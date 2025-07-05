// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SoulboundPledgeNFT.sol";

contract PledgeToCreate is Ownable, ReentrancyGuard {
    struct Campaign {
        address creator;
        string title;
        string description;
        string imageUrl;
        uint256 goal;
        uint256 pledged;
        uint256 createdAt;
        bool withdrawn;
        bool active;
    }

    struct Pledge {
        address pledger;
        uint256 campaignId;
        uint256 amount;
        uint256 timestamp;
        uint256 nftTokenId;
    }

    // State variables
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => Pledge[]) public userPledges;
    mapping(uint256 => address[]) public campaignPledgers;
    mapping(address => uint256) public totalPledgedByUser;
    
    uint256 public campaignCount;
    uint256 public platformRevenue;
    uint256 public totalPledged;
    uint256 public platformFeePercentage = 500; // 5% (500 basis points)
    
    SoulboundPledgeNFT public nftContract;
    
    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 createdAt
    );
    
    event PledgeMade(
        uint256 indexed campaignId,
        address indexed pledger,
        uint256 amount,
        uint256 timestamp,
        uint256 nftTokenId
    );
    
    event CampaignWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );
    
    event RevenueDistributed(
        uint256 totalAmount,
        uint256 recipientCount
    );

    constructor() Ownable(msg.sender) {
        // Deploy NFT contract
        nftContract = new SoulboundPledgeNFT(address(this));
    }

    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _imageUrl,
        uint256 _goal
    ) external returns (uint256) {
        require(_goal > 0, "Goal must be greater than 0");
        require(bytes(_title).length > 0, "Title cannot be empty");

        uint256 campaignId = campaignCount++;
        
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            title: _title,
            description: _description,
            imageUrl: _imageUrl,
            goal: _goal,
            pledged: 0,
            createdAt: block.timestamp,
            withdrawn: false,
            active: true
        });

        emit CampaignCreated(campaignId, msg.sender, _title, _goal, block.timestamp);
        return campaignId;
    }

    function pledgeToCampaign(uint256 _campaignId) external payable nonReentrant {
        require(_campaignId < campaignCount, "Campaign does not exist");
        require(msg.value > 0, "Pledge amount must be greater than 0");
        
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.active, "Campaign is not active");
        require(!campaign.withdrawn, "Campaign funds already withdrawn");

        _processPledge(_campaignId, campaign);
    }

    function _processPledge(uint256 _campaignId, Campaign storage campaign) internal {
        // Calculate platform fee
        uint256 platformFee = (msg.value * platformFeePercentage) / 10000;
        uint256 pledgeAmount = msg.value - platformFee;

        // Update campaign and global stats
        campaign.pledged += pledgeAmount;
        platformRevenue += platformFee;
        totalPledged += pledgeAmount;
        totalPledgedByUser[msg.sender] += pledgeAmount;

        // Mint NFT and record pledge
        uint256 nftTokenId = _mintPledgeNFT(_campaignId, pledgeAmount, campaign.title);
        _recordPledge(_campaignId, pledgeAmount, nftTokenId);
        _updateCampaignPledgers(_campaignId);

        emit PledgeMade(_campaignId, msg.sender, pledgeAmount, block.timestamp, nftTokenId);
    }

    function _mintPledgeNFT(uint256 _campaignId, uint256 _amount, string memory _title) internal returns (uint256) {
        return nftContract.mintPledgeSBT(msg.sender, _campaignId, _amount, _title);
    }

    function _recordPledge(uint256 _campaignId, uint256 _amount, uint256 _nftTokenId) internal {
        userPledges[msg.sender].push(Pledge({
            pledger: msg.sender,
            campaignId: _campaignId,
            amount: _amount,
            timestamp: block.timestamp,
            nftTokenId: _nftTokenId
        }));
    }

    function _updateCampaignPledgers(uint256 _campaignId) internal {
        address[] storage pledgers = campaignPledgers[_campaignId];
        
        // Check if pledger already exists
        for (uint256 i = 0; i < pledgers.length; i++) {
            if (pledgers[i] == msg.sender) {
                return; // Already exists
            }
        }
        
        // Add new pledger
        pledgers.push(msg.sender);
    }

    function withdrawCampaignFunds(uint256 _campaignId) external nonReentrant {
        require(_campaignId < campaignCount, "Campaign does not exist");
        
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only creator can withdraw");
        require(!campaign.withdrawn, "Funds already withdrawn");
        require(campaign.pledged >= campaign.goal, "Campaign goal not reached");

        campaign.withdrawn = true;
        uint256 amount = campaign.pledged;

        (bool success, ) = payable(campaign.creator).call{value: amount}("");
        require(success, "Transfer failed");

        emit CampaignWithdrawn(_campaignId, campaign.creator, amount);
    }

    function distributeRevenue() external onlyOwner nonReentrant {
        require(platformRevenue > 0, "No revenue to distribute");
        require(totalPledged > 0, "No pledges made yet");

        uint256 revenueToDistribute = platformRevenue;
        platformRevenue = 0;

        address[] memory allPledgers = getAllPledgers();
        uint256 recipientCount = _distributeToUsers(revenueToDistribute, allPledgers);

        emit RevenueDistributed(revenueToDistribute, recipientCount);
    }

    function _distributeToUsers(uint256 _revenue, address[] memory _pledgers) internal returns (uint256) {
        uint256 recipientCount = 0;
        
        for (uint256 i = 0; i < _pledgers.length; i++) {
            address pledger = _pledgers[i];
            uint256 userTotal = totalPledgedByUser[pledger];
            
            if (userTotal > 0) {
                uint256 share = (_revenue * userTotal) / totalPledged;
                if (share > 0) {
                    (bool success, ) = payable(pledger).call{value: share}("");
                    if (success) {
                        recipientCount++;
                    }
                }
            }
        }
        
        return recipientCount;
    }

    function getAllPledgers() public view returns (address[] memory) {
        address[] memory tempPledgers = new address[](1000);
        uint256 count = 0;

        for (uint256 i = 0; i < campaignCount; i++) {
            address[] memory campaignPledgersList = campaignPledgers[i];
            count = _addUniquePledgers(campaignPledgersList, tempPledgers, count);
        }

        return _createFinalArray(tempPledgers, count);
    }

    function _addUniquePledgers(
        address[] memory _campaignPledgers,
        address[] memory _tempPledgers,
        uint256 _currentCount
    ) internal pure returns (uint256) {
        uint256 count = _currentCount;
        
        for (uint256 j = 0; j < _campaignPledgers.length; j++) {
            address pledger = _campaignPledgers[j];
            bool exists = false;
            
            for (uint256 k = 0; k < count; k++) {
                if (_tempPledgers[k] == pledger) {
                    exists = true;
                    break;
                }
            }
            
            if (!exists && count < 1000) {
                _tempPledgers[count] = pledger;
                count++;
            }
        }
        
        return count;
    }

    function _createFinalArray(address[] memory _tempPledgers, uint256 _count) internal pure returns (address[] memory) {
        address[] memory pledgers = new address[](_count);
        for (uint256 i = 0; i < _count; i++) {
            pledgers[i] = _tempPledgers[i];
        }
        return pledgers;
    }

    // View functions
    function getCampaign(uint256 _campaignId) external view returns (Campaign memory) {
        require(_campaignId < campaignCount, "Campaign does not exist");
        return campaigns[_campaignId];
    }

    function getUserPledges(address _user) external view returns (Pledge[] memory) {
        return userPledges[_user];
    }

    function getCampaignPledgers(uint256 _campaignId) external view returns (address[] memory) {
        require(_campaignId < campaignCount, "Campaign does not exist");
        return campaignPledgers[_campaignId];
    }

    function getUserTotalPledged(address _user) external view returns (uint256) {
        return totalPledgedByUser[_user];
    }

    function getNFTContract() external view returns (address) {
        return address(nftContract);
    }

    // Admin functions
    function setPlatformFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = _feePercentage;
    }

    function pauseCampaign(uint256 _campaignId) external onlyOwner {
        require(_campaignId < campaignCount, "Campaign does not exist");
        campaigns[_campaignId].active = false;
    }

    function unpauseCampaign(uint256 _campaignId) external onlyOwner {
        require(_campaignId < campaignCount, "Campaign does not exist");
        campaigns[_campaignId].active = true;
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdraw failed");
    }

    receive() external payable {
        platformRevenue += msg.value;
    }
} 