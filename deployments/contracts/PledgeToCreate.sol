// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SoulboundPledgeNFT.sol";
import "./VRFConsumer.sol";
import "./IRoninVRFCoordinatorForConsumers.sol";

contract PledgeToCreate is Ownable, ReentrancyGuard, VRFConsumer {
    enum RaffleType { Campaign, Daily }

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
        uint256 nextRaffleMilestone;
        uint256 rafflePrize;
    }

    struct Pledge {
        address pledger;
        uint256 campaignId;
        uint256 amount;
        uint256 timestamp;
        uint256 nftTokenId;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(address => Pledge[]) public userPledges;
    mapping(uint256 => address[]) public campaignPledgers;
    mapping(address => uint256) public totalPledgedByUser;
    mapping(uint256 => mapping(address => uint256)) public pledgedPerCampaign;
    mapping(uint256 => address[]) public dailyPledgers;

    mapping(bytes32 => uint256) public raffleCampaignId;
    mapping(bytes32 => uint256) public raffleDay;
    mapping(bytes32 => RaffleType) public raffleType;

    uint256 public campaignCount;
    uint256 public platformRevenue;
    uint256 public platformProfit;
    uint256 public dailyRafflePool;
    uint256 public totalPledged;
    uint256 public platformFeePercentage = 500; // 5%

    SoulboundPledgeNFT public nftContract;

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goal, uint256 createdAt);
    event PledgeMade(uint256 indexed campaignId, address indexed pledger, uint256 amount, uint256 timestamp, uint256 nftTokenId);
    event CampaignWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event CampaignRaffleRequested(uint256 indexed campaignId, bytes32 requestHash);
    event DailyRaffleRequested(uint256 indexed day, bytes32 requestHash);
    event CampaignRaffleWinner(uint256 indexed campaignId, address winner, uint256 prize);
    event DailyRaffleWinner(uint256 indexed day, address winner, uint256 prize);

    constructor(address _vrfCoordinator) Ownable(msg.sender) VRFConsumer(_vrfCoordinator) {
        nftContract = new SoulboundPledgeNFT(address(this));
    }

    function createCampaign(string memory _title, string memory _description, string memory _imageUrl, uint256 _goal) external returns (uint256) {
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
            active: true,
            nextRaffleMilestone: 10,
            rafflePrize: 0
        });

        emit CampaignCreated(campaignId, msg.sender, _title, _goal, block.timestamp);
        return campaignId;
    }

    function pledgeToCampaign(uint256 _campaignId) external payable nonReentrant {
        require(_campaignId < campaignCount, "Campaign does not exist");
        require(msg.value > 0, "Pledge must be greater than 0");

        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.active, "Campaign inactive");
        require(!campaign.withdrawn, "Funds withdrawn");

        uint256 platformFee = (msg.value * platformFeePercentage) / 10000;
        uint256 pledgeAmount = msg.value - platformFee;

        campaign.pledged += pledgeAmount;
        platformRevenue += platformFee;
        totalPledged += pledgeAmount;
        totalPledgedByUser[msg.sender] += pledgeAmount;
        pledgedPerCampaign[_campaignId][msg.sender] += pledgeAmount;

        uint256 dailyCut = (platformFee * 30) / 100;
        uint256 raffleCut = (platformFee * 40) / 100;
        uint256 profitCut = (platformFee * 20) / 100;

        dailyRafflePool += dailyCut;
        campaign.rafflePrize += raffleCut;
        platformProfit += profitCut;

        uint256 nftTokenId = nftContract.mintPledgeSBT(msg.sender, _campaignId, pledgeAmount, campaign.title);
        userPledges[msg.sender].push(Pledge({
            pledger: msg.sender,
            campaignId: _campaignId,
            amount: pledgeAmount,
            timestamp: block.timestamp,
            nftTokenId: nftTokenId
        }));

        address[] storage pledgers = campaignPledgers[_campaignId];
        bool exists = false;
        for (uint256 i = 0; i < pledgers.length; i++) {
            if (pledgers[i] == msg.sender) {
                exists = true;
                break;
            }
        }
        if (!exists) pledgers.push(msg.sender);

        uint256 currentDay = block.timestamp / 1 days;
        dailyPledgers[currentDay].push(msg.sender);

        emit PledgeMade(_campaignId, msg.sender, pledgeAmount, block.timestamp, nftTokenId);

        while (campaign.pledged >= (campaign.goal * campaign.nextRaffleMilestone) / 100) {
            _requestCampaignRaffle(_campaignId);
            campaign.nextRaffleMilestone += 10;
        }
    }

    function _requestCampaignRaffle(uint256 _campaignId) internal {
        uint256 callbackGasLimit = 800000; // Increased gas limit for complex raffle logic
        uint256 gasPrice = getGasPrice();
        
        // Estimate the VRF fee
        uint256 estimatedFee = IRoninVRFCoordinatorForConsumers(vrfCoordinator).estimateRequestRandomFee(
            callbackGasLimit, 
            gasPrice
        );
        
        // Ensure we have enough funds
        require(address(this).balance >= estimatedFee, "Insufficient funds for VRF request");
        
        bytes32 reqHash = _requestRandomness(
            estimatedFee,
            callbackGasLimit,
            gasPrice,
            address(this) // Refund to contract
        );
        
        raffleType[reqHash] = RaffleType.Campaign;
        raffleCampaignId[reqHash] = _campaignId;
        emit CampaignRaffleRequested(_campaignId, reqHash);
    }

    function drawDailyRaffle(uint256 day) external onlyOwner nonReentrant {
        require(dailyRafflePool > 0, "No daily raffle funds");
        
        uint256 callbackGasLimit = 800000; // Increased gas limit for complex raffle logic
        uint256 gasPrice = getGasPrice();
        
        // Estimate the VRF fee
        uint256 estimatedFee = IRoninVRFCoordinatorForConsumers(vrfCoordinator).estimateRequestRandomFee(
            callbackGasLimit, 
            gasPrice
        );
        
        // Ensure we have enough funds
        require(address(this).balance >= estimatedFee, "Insufficient funds for VRF request");
        
        bytes32 reqHash = _requestRandomness(
            estimatedFee,
            callbackGasLimit,
            gasPrice,
            address(this) // Refund to contract
        );
        
        raffleType[reqHash] = RaffleType.Daily;
        raffleDay[reqHash] = day;
        emit DailyRaffleRequested(day, reqHash);
    }

    function _fulfillRandomSeed(bytes32 reqHash, uint256 randomSeed) internal override {
        if (raffleType[reqHash] == RaffleType.Campaign) {
            _processCampaignRaffle(reqHash, randomSeed);
        } else if (raffleType[reqHash] == RaffleType.Daily) {
            _processDailyRaffle(reqHash, randomSeed);
        }
    }

    function _processCampaignRaffle(bytes32 reqHash, uint256 randomSeed) internal {
        uint256 campaignId = raffleCampaignId[reqHash];
        address[] memory pledgers = campaignPledgers[campaignId];
        
        if (pledgers.length == 0) return;
        
        // Calculate total weight
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < pledgers.length; i++) {
            totalWeight += pledgedPerCampaign[campaignId][pledgers[i]];
        }
        
        if (totalWeight == 0) return;
        
        // Select winner using weighted random selection
        uint256 rand = randomSeed % totalWeight;
        uint256 cumWeight = 0;
        
        for (uint256 i = 0; i < pledgers.length; i++) {
            cumWeight += pledgedPerCampaign[campaignId][pledgers[i]];
            if (rand < cumWeight) {
                address winner = pledgers[i];
                uint256 prize = campaigns[campaignId].rafflePrize;
                campaigns[campaignId].rafflePrize = 0;
                
                // Safe transfer with gas limit
                (bool success, ) = payable(winner).call{value: prize, gas: 50000}("");
                if (!success) {
                    // If transfer fails, add prize back to campaign
                    campaigns[campaignId].rafflePrize = prize;
                    return;
                }
                
                emit CampaignRaffleWinner(campaignId, winner, prize);
                break;
            }
        }
    }

    function _processDailyRaffle(bytes32 reqHash, uint256 randomSeed) internal {
        uint256 day = raffleDay[reqHash];
        address[] memory pledgers = dailyPledgers[day];
        
        if (pledgers.length == 0) return;
        
        // Calculate total weight
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < pledgers.length; i++) {
            totalWeight += totalPledgedByUser[pledgers[i]];
        }
        
        if (totalWeight == 0) return;
        
        // Select winner using weighted random selection
        uint256 rand = randomSeed % totalWeight;
        uint256 cumWeight = 0;
        
        for (uint256 i = 0; i < pledgers.length; i++) {
            cumWeight += totalPledgedByUser[pledgers[i]];
            if (rand < cumWeight) {
                address winner = pledgers[i];
                uint256 prize = dailyRafflePool;
                dailyRafflePool = 0;
                
                // Safe transfer with gas limit
                (bool success, ) = payable(winner).call{value: prize, gas: 50000}("");
                if (!success) {
                    // If transfer fails, add prize back to pool
                    dailyRafflePool = prize;
                    return;
                }
                
                emit DailyRaffleWinner(day, winner, prize);
                break;
            }
        }
    }

    function getGasPrice() public view returns (uint256) {
        // Ensure minimum gas price of 21 GWEI as per Ronin VRF requirements
        uint256 calculatedPrice = 20e9 + block.basefee * 2;
        uint256 minimumPrice = 21e9; // 21 GWEI minimum
        return calculatedPrice > minimumPrice ? calculatedPrice : minimumPrice;
    }

    // Function to estimate VRF fee for external calls
    function estimateVRFRequestFee() external view returns (uint256) {
        uint256 callbackGasLimit = 800000;
        uint256 gasPrice = getGasPrice();
        return IRoninVRFCoordinatorForConsumers(vrfCoordinator).estimateRequestRandomFee(
            callbackGasLimit, 
            gasPrice
        );
    }

    // Function to fund the contract for VRF requests
    function fundForVRF() external payable {
        platformRevenue += msg.value;
    }

    // Emergency function to withdraw stuck funds
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    receive() external payable {
        platformRevenue += msg.value;
    }

    function getNFTContract() external view returns (address) {
        return address(nftContract);
    }
}
