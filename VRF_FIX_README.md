# VRF Integration Fix for Helpify

## Issues Fixed

The original VRF implementation had several critical issues that caused randomness requests to fail:

### 1. **Incorrect Fee Estimation**
- **Problem**: Using `address(this).balance` instead of properly estimating VRF fees
- **Fix**: Added proper fee estimation using `estimateRequestRandomFee()` from the VRF coordinator

### 2. **Insufficient Gas Limits**
- **Problem**: 500,000 gas limit was too low for complex raffle logic
- **Fix**: Increased callback gas limit to 800,000 gas

### 3. **Gas Price Requirements**
- **Problem**: Gas price didn't meet Ronin VRF minimum requirement of 21 GWEI
- **Fix**: Added minimum gas price check ensuring at least 21 GWEI

### 4. **Unsafe External Calls**
- **Problem**: Unbounded external calls could cause out-of-gas errors
- **Fix**: Added gas limits to external calls and graceful failure handling

### 5. **Complex Callback Logic**
- **Problem**: All raffle logic in one function could exceed gas limits
- **Fix**: Split into separate functions for campaign and daily raffles

## Key Changes

### Smart Contract Updates

1. **Proper Fee Estimation**
   ```solidity
   uint256 estimatedFee = IRoninVRFCoordinatorForConsumers(vrfCoordinator).estimateRequestRandomFee(
       callbackGasLimit, 
       gasPrice
   );
   ```

2. **Increased Gas Limits**
   ```solidity
   uint256 callbackGasLimit = 800000; // Increased from 500000
   ```

3. **Minimum Gas Price**
   ```solidity
   function getGasPrice() public view returns (uint256) {
       uint256 calculatedPrice = 20e9 + block.basefee * 2;
       uint256 minimumPrice = 21e9; // 21 GWEI minimum
       return calculatedPrice > minimumPrice ? calculatedPrice : minimumPrice;
   }
   ```

4. **Safe External Calls**
   ```solidity
   (bool success, ) = payable(winner).call{value: prize, gas: 50000}("");
   if (!success) {
       // Graceful failure handling
       campaigns[campaignId].rafflePrize = prize;
       return;
   }
   ```

5. **Separated Raffle Logic**
   - `_processCampaignRaffle()` - Handles campaign-specific raffles
   - `_processDailyRaffle()` - Handles daily raffles

### New Utility Functions

1. **`estimateVRFRequestFee()`** - Get current VRF fee estimate
2. **`fundForVRF()`** - Fund contract for VRF requests
3. **`emergencyWithdraw()`** - Emergency fund recovery
4. **`getGasPrice()`** - Get compliant gas price

## Deployment Instructions

### 1. Deploy the Fixed Contract

```bash
npx hardhat run deployments/deploy_vrf_fixed.js --network saigon
```

### 2. Update Frontend Configuration

Update `site/lib/contracts.ts` with the new contract address:

```typescript
export const CONTRACTS = {
  PLEDGE_TO_CREATE: "0x[NEW_CONTRACT_ADDRESS]",
  // ... other contracts
};
```

### 3. Fund the Contract

The contract needs RON to pay for VRF requests. You can fund it in two ways:

**Option A: During deployment (automatic)**
```javascript
// Already included in deploy_vrf_fixed.js
await pledgeToCreate.fundForVRF({ value: ethers.utils.parseEther("1.0") });
```

**Option B: Manual funding**
```javascript
await contract.fundForVRF({ value: ethers.utils.parseEther("1.0") });
```

### 4. Test the Integration

```bash
node test_vrf_integration.js
```

## VRF Requirements

### Ronin VRF Coordinator Addresses

- **Saigon Testnet**: `0xa60c1e07fa030e4b49eb54950adb298ab94dd312`
- **Ronin Mainnet**: `0x16a62a921e7fec5bf867ff5c805b662db757b778`

### Fee Structure

- **Service Charge**: 0.01 USD (in RON)
- **Oracle Gas Fee**: Depends on gas price and callback gas limit
- **Minimum Gas Price**: 21 GWEI
- **Recommended Gas Price**: `basefee * 2 + 20` GWEI

### Estimated Costs

With current settings:
- **Callback Gas Limit**: 800,000 gas
- **Gas Price**: ~22 GWEI (basefee * 2 + 20)
- **Estimated Fee**: ~0.0175 RON per request

## Testing Checklist

Before going live, verify:

- [ ] Contract deployed with correct VRF coordinator address
- [ ] Contract funded with sufficient RON for VRF requests
- [ ] Gas price meets minimum requirement (21 GWEI)
- [ ] Fee estimation returns reasonable values
- [ ] Campaign creation works
- [ ] Pledging triggers raffle requests
- [ ] VRF fulfillment completes successfully
- [ ] Winners receive prizes correctly

## Monitoring

### Important Events to Monitor

1. **`CampaignRaffleRequested`** - Raffle request made
2. **`CampaignRaffleWinner`** - Winner selected
3. **`DailyRaffleWinner`** - Daily winner selected

### Common Issues

1. **"Insufficient funds for VRF request"**
   - Solution: Fund the contract using `fundForVRF()`

2. **VRF callback fails**
   - Check gas limits are sufficient
   - Verify contract has enough RON for prize payouts

3. **Gas price too low**
   - Ensure gas price meets 21 GWEI minimum

## Emergency Procedures

### If VRF Requests Fail

1. Check contract balance: `await ethers.provider.getBalance(CONTRACT_ADDRESS)`
2. Estimate required fee: `await contract.estimateVRFRequestFee()`
3. Fund if needed: `await contract.fundForVRF({ value: requiredAmount })`

### If Contract Gets Stuck

1. Use emergency withdraw: `await contract.emergencyWithdraw()` (owner only)
2. Redeploy with fixes if necessary

## Support

For VRF-related issues, refer to:
- [Ronin VRF Documentation](https://docs.roninchain.com/developers/tools/vrf)
- [Ronin VRF GitHub Repository](https://github.com/ronin-chain/ronin-random-beacon)

## Contract Verification

After deployment, verify the contract on Ronin Explorer:
1. Go to your contract address on explorer
2. Click "Contract" tab
3. Click "Verify and Publish"
4. Use the same compiler version and settings used for deployment 