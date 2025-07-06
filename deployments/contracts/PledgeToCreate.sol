// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SoulboundPledgeNFT.sol";
import "./VRFConsumer.sol";
import "./IRoninVRFCoordinatorForConsumers.sol";

contract PledgeToCreate is Ownable, ReentrancyGuard, VRFConsumer {
    using SafeERC20 for IERC20;

    enum RaffleType { Campaign, Daily }
    enum PrizeType { ERC20, ERC721, ERC1155 }

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
        bool ended;
        bool prizesClaimed;
    }

    struct Prize {
        PrizeType prizeType;
        address tokenContract;
        uint256 tokenId; // Used for ERC721/ERC1155, unused for ERC20
        uint256 amount; // Used for ERC20/ERC1155, unused for ERC721
        address depositor;
        string description;
    }

    struct Pledge {
        address pledger;
        uint256 campaignId;
        uint256 amount;
        uint256 timestamp;
        uint256 nftTokenId;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Prize[]) public campaignPrizes;
    mapping(address => Pledge[]) public userPledges;
    mapping(uint256 => address[]) public campaignPledgers;
    mapping(address => uint256) public totalPledgedByUser;
    mapping(uint256 => mapping(address => uint256)) public pledgedPerCampaign;

    // Daily raffle tracking - only last 24 hours
    mapping(uint256 => address[]) public dailyPledgers;
    mapping(bytes32 => uint256) public raffleCampaignId;
    mapping(bytes32 => uint256) public raffleDay;
    mapping(bytes32 => RaffleType) public raffleType;

    uint256 public campaignCount;
    uint256 public dailyRafflePool;
    uint256 public totalPledged;
    uint256 public platformFeePercentage = 500; // 5%

    SoulboundPledgeNFT public nftContract;

    event CampaignCreated(uint256 indexed campaignId, address indexed creator, string title, uint256 goal, uint256 createdAt);
    event PledgeMade(uint256 indexed campaignId, address indexed pledger, uint256 amount, uint256 timestamp, uint256 nftTokenId);
    event CampaignWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);
    event CampaignEnded(uint256 indexed campaignId);
    event PrizeDeposited(uint256 indexed campaignId, address indexed depositor, PrizeType prizeType, address tokenContract, uint256 tokenId, uint256 amount);
    event CampaignRaffleRequested(uint256 indexed campaignId, bytes32 requestHash);
    event DailyRaffleRequested(uint256 indexed day, bytes32 requestHash);
    event CampaignPrizeWinner(uint256 indexed campaignId, address winner, uint256 prizeIndex);
    event DailyRaffleWinner(uint256 indexed day, address winner, uint256 prize);
    event VRFFunded(address indexed funder, uint256 amount);
    event EmergencyWithdrawal(address indexed owner, uint256 amount);
    event CampaignPrizesCompleted(uint256 indexed campaignId);
    event PrizeTransferFailed(uint256 indexed campaignId, uint256 prizeIndex, address winner);
    event DailyRaffleTransferFailed(uint256 indexed day, address winner, uint256 prize);

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
            ended: false,
            prizesClaimed: false
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
        require(!campaign.ended, "Campaign ended");

        uint256 platformFee = (msg.value * platformFeePercentage) / 10000;
        uint256 pledgeAmount = msg.value - platformFee;

        campaign.pledged += pledgeAmount;
        dailyRafflePool += platformFee;
        totalPledged += pledgeAmount;
        totalPledgedByUser[msg.sender] += pledgeAmount;
        pledgedPerCampaign[_campaignId][msg.sender] += pledgeAmount;

        uint256 nftTokenId = nftContract.mintPledgeSBT(msg.sender, _campaignId, pledgeAmount, campaign.title);
        userPledges[msg.sender].push(Pledge({
            pledger: msg.sender,
            campaignId: _campaignId,
            amount: pledgeAmount,
            timestamp: block.timestamp,
            nftTokenId: nftTokenId
        }));

        // Add to campaign pledgers if not already added
        address[] storage pledgers = campaignPledgers[_campaignId];
        bool exists = false;
        for (uint256 i = 0; i < pledgers.length; i++) {
            if (pledgers[i] == msg.sender) {
                exists = true;
                break;
            }
        }
        if (!exists) pledgers.push(msg.sender);

        // Add to daily pledgers (last 24 hours)
        uint256 currentDay = block.timestamp / 1 days;
        dailyPledgers[currentDay].push(msg.sender);

        emit PledgeMade(_campaignId, msg.sender, pledgeAmount, block.timestamp, nftTokenId);
    }

    function depositERC20Prize(
        uint256 _campaignId,
        address _tokenContract,
        uint256 _amount,
        string memory _description
    ) external nonReentrant {
        require(_campaignId < campaignCount, "Campaign does not exist");
        require(campaigns[_campaignId].active, "Campaign inactive");
        require(!campaigns[_campaignId].ended, "Campaign ended");
        require(_amount > 0, "Amount must be greater than 0");

        IERC20(_tokenContract).safeTransferFrom(msg.sender, address(this), _amount);

        campaignPrizes[_campaignId].push(Prize({
            prizeType: PrizeType.ERC20,
            tokenContract: _tokenContract,
            tokenId: 0,
            amount: _amount,
            depositor: msg.sender,
            description: _description
        }));

        emit PrizeDeposited(_campaignId, msg.sender, PrizeType.ERC20, _tokenContract, 0, _amount);
    }

    function depositERC721Prize(
        uint256 _campaignId,
        address _tokenContract,
        uint256 _tokenId,
        string memory _description
    ) external nonReentrant {
        require(_campaignId < campaignCount, "Campaign does not exist");
        require(campaigns[_campaignId].active, "Campaign inactive");
        require(!campaigns[_campaignId].ended, "Campaign ended");

        IERC721(_tokenContract).transferFrom(msg.sender, address(this), _tokenId);

        campaignPrizes[_campaignId].push(Prize({
            prizeType: PrizeType.ERC721,
            tokenContract: _tokenContract,
            tokenId: _tokenId,
            amount: 0,
            depositor: msg.sender,
            description: _description
        }));

        emit PrizeDeposited(_campaignId, msg.sender, PrizeType.ERC721, _tokenContract, _tokenId, 0);
    }

    function depositERC1155Prize(
        uint256 _campaignId,
        address _tokenContract,
        uint256 _tokenId,
        uint256 _amount,
        string memory _description
    ) external nonReentrant {
        require(_campaignId < campaignCount, "Campaign does not exist");
        require(campaigns[_campaignId].active, "Campaign inactive");
        require(!campaigns[_campaignId].ended, "Campaign ended");
        require(_amount > 0, "Amount must be greater than 0");

        IERC1155(_tokenContract).safeTransferFrom(msg.sender, address(this), _tokenId, _amount, "");

        campaignPrizes[_campaignId].push(Prize({
            prizeType: PrizeType.ERC1155,
            tokenContract: _tokenContract,
            tokenId: _tokenId,
            amount: _amount,
            depositor: msg.sender,
            description: _description
        }));

        emit PrizeDeposited(_campaignId, msg.sender, PrizeType.ERC1155, _tokenContract, _tokenId, _amount);
    }

    function endCampaign(uint256 _campaignId) external nonReentrant {
        require(_campaignId < campaignCount, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.active, "Campaign inactive");
        require(!campaign.ended, "Campaign already ended");
        require(msg.sender == campaign.creator || msg.sender == owner(), "Not authorized");

        campaign.ended = true;
        emit CampaignEnded(_campaignId);

        // If there are prizes, request VRF for final draw
        if (campaignPrizes[_campaignId].length > 0) {
            _requestCampaignRaffle(_campaignId);
        }
    }

    function _requestCampaignRaffle(uint256 _campaignId) internal {
        uint256 callbackGasLimit = 800000;
        uint256 gasPrice = getGasPrice();
        
        uint256 estimatedFee = IRoninVRFCoordinatorForConsumers(vrfCoordinator).estimateRequestRandomFee(
            callbackGasLimit, 
            gasPrice
        );
        
        require(address(this).balance >= estimatedFee, "Insufficient funds for VRF request");
        
        bytes32 reqHash = _requestRandomness(
            estimatedFee,
            callbackGasLimit,
            gasPrice,
            address(this)
        );
        
        raffleType[reqHash] = RaffleType.Campaign;
        raffleCampaignId[reqHash] = _campaignId;
        emit CampaignRaffleRequested(_campaignId, reqHash);
    }

    function drawDailyRaffle() external nonReentrant {
        require(dailyRafflePool > 0, "No daily raffle funds");
        
        uint256 currentDay = block.timestamp / 1 days;
        require(dailyPledgers[currentDay].length > 0, "No pledgers in last 24 hours");
        
        uint256 callbackGasLimit = 800000;
        uint256 gasPrice = getGasPrice();
        
        uint256 estimatedFee = IRoninVRFCoordinatorForConsumers(vrfCoordinator).estimateRequestRandomFee(
            callbackGasLimit, 
            gasPrice
        );
        
        require(address(this).balance >= estimatedFee, "Insufficient funds for VRF request");
        
        bytes32 reqHash = _requestRandomness(
            estimatedFee,
            callbackGasLimit,
            gasPrice,
            address(this)
        );
        
        raffleType[reqHash] = RaffleType.Daily;
        raffleDay[reqHash] = currentDay;
        emit DailyRaffleRequested(currentDay, reqHash);
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
        Prize[] memory prizes = campaignPrizes[campaignId];
        
        if (pledgers.length == 0 || prizes.length == 0) return;
        
        // Calculate total weight
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < pledgers.length; i++) {
            totalWeight += pledgedPerCampaign[campaignId][pledgers[i]];
        }
        
        if (totalWeight == 0) return;
        
        // Distribute all prizes using different indices of the random seed
        for (uint256 prizeIndex = 0; prizeIndex < prizes.length; prizeIndex++) {
            uint256 rand = uint256(keccak256(abi.encode(randomSeed, prizeIndex))) % totalWeight;
            uint256 cumWeight = 0;
            
            for (uint256 i = 0; i < pledgers.length; i++) {
                cumWeight += pledgedPerCampaign[campaignId][pledgers[i]];
                if (rand < cumWeight) {
                    address winner = pledgers[i];
                    _transferPrize(campaignId, prizeIndex, winner);
                    emit CampaignPrizeWinner(campaignId, winner, prizeIndex);
                    break;
                }
            }
        }
        
        campaigns[campaignId].prizesClaimed = true;
        emit CampaignPrizesCompleted(campaignId);
    }

    function _transferPrize(uint256 _campaignId, uint256 _prizeIndex, address _winner) internal {
        Prize storage prize = campaignPrizes[_campaignId][_prizeIndex];
        
        try this._safeTransferPrize(_campaignId, _prizeIndex, _winner) {
            // Prize transferred successfully
        } catch {
            emit PrizeTransferFailed(_campaignId, _prizeIndex, _winner);
        }
    }

    function _safeTransferPrize(uint256 _campaignId, uint256 _prizeIndex, address _winner) external {
        require(msg.sender == address(this), "Only contract can call");
        Prize storage prize = campaignPrizes[_campaignId][_prizeIndex];
        
        if (prize.prizeType == PrizeType.ERC20) {
            IERC20(prize.tokenContract).safeTransfer(_winner, prize.amount);
        } else if (prize.prizeType == PrizeType.ERC721) {
            IERC721(prize.tokenContract).transferFrom(address(this), _winner, prize.tokenId);
        } else if (prize.prizeType == PrizeType.ERC1155) {
            IERC1155(prize.tokenContract).safeTransferFrom(address(this), _winner, prize.tokenId, prize.amount, "");
        }
    }

    function _processDailyRaffle(bytes32 reqHash, uint256 randomSeed) internal {
        uint256 day = raffleDay[reqHash];
        address[] memory pledgers = dailyPledgers[day];
        
        if (pledgers.length == 0) return;
        
        // Calculate total weight based on total pledged by each user
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
                
                (bool success, ) = payable(winner).call{value: prize, gas: 50000}("");
                if (!success) {
                    dailyRafflePool = prize;
                    emit DailyRaffleTransferFailed(day, winner, prize);
                    return;
                }
                
                emit DailyRaffleWinner(day, winner, prize);
                break;
            }
        }
    }

    function withdrawCampaignFunds(uint256 _campaignId) external nonReentrant {
        require(_campaignId < campaignCount, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Not campaign creator");
        require(!campaign.withdrawn, "Already withdrawn");
        require(campaign.pledged > 0, "No funds to withdraw");

        campaign.withdrawn = true;
        uint256 amount = campaign.pledged;
        campaign.pledged = 0;

        (bool success, ) = payable(campaign.creator).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit CampaignWithdrawn(_campaignId, campaign.creator, amount);
    }

    function getCampaignPrizes(uint256 _campaignId) external view returns (Prize[] memory) {
        require(_campaignId < campaignCount, "Campaign does not exist");
        return campaignPrizes[_campaignId];
    }

    function getCampaignPrizeCount(uint256 _campaignId) external view returns (uint256) {
        require(_campaignId < campaignCount, "Campaign does not exist");
        return campaignPrizes[_campaignId].length;
    }

    function getGasPrice() public view returns (uint256) {
        uint256 calculatedPrice = 20e9 + block.basefee * 2;
        uint256 minimumPrice = 21e9;
        return calculatedPrice > minimumPrice ? calculatedPrice : minimumPrice;
    }

    function estimateVRFRequestFee() external view returns (uint256) {
        uint256 callbackGasLimit = 800000;
        uint256 gasPrice = getGasPrice();
        return IRoninVRFCoordinatorForConsumers(vrfCoordinator).estimateRequestRandomFee(
            callbackGasLimit, 
            gasPrice
        );
    }

    function fundForVRF() external payable {
        // Funds sent directly to contract for VRF requests
        emit VRFFunded(msg.sender, msg.value);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        emit EmergencyWithdrawal(msg.sender, balance);
    }

    receive() external payable {
        // Accept ETH for VRF funding
        emit VRFFunded(msg.sender, msg.value);
    }

    function getNFTContract() external view returns (address) {
        return address(nftContract);
    }
}
