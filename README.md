# CrossChain USDC Transfer API

A simple REST API for cross-chain USDC transfers using LiFi Protocol. No rate limiting, fully CORS-enabled for easy frontend integration.

## 🚀 Quick Start

### Installation & Setup

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd crosschain-usdc
npm install
```

2. **Environment setup:**
```bash
cp env.example .env
# Edit .env with your LiFi API key (optional - has fallback)
```

3. **Start the server:**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Server runs on `http://localhost:3000` by default.

## 📡 API Endpoints

### Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "crosschain-usdc-api"
}
```

### Get Supported Chains
```
GET /chains
```
**Response:** Array of supported blockchain networks with chain IDs, names, and token information.

### Get Transfer Quote
```
GET /transfer?fromChain=137&toChain=8453&fromToken=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359&toToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&amount=1000000&fromAddress=0xYourAddress&toAddress=0xYourAddress&fromAmount=1000000&order=FASTEST
```

**Required Parameters:**
- `fromChain` - Source chain ID (e.g., 137 for Polygon)
- `toChain` - Destination chain ID (e.g., 8453 for Base)
- `fromToken` - Source token contract address
- `toToken` - Destination token contract address
- `amount` - Transfer amount in smallest units (e.g., 1000000 = 1 USDC)
- `fromAddress` - Sender wallet address
- `toAddress` - Recipient wallet address  
- `fromAmount` - Same as amount (required by LiFi)
- `order` - Route preference (`FASTEST`, `CHEAPEST`, `SAFEST`)

**Response Format:**
```json
{
  "success": true,
  "transfer": {
    "from": {
      "chain": 137,
      "token": "USDC",
      "amount": "1000000",
      "amountFormatted": "1.000000",
      "address": "0xYourAddress"
    },
    "to": {
      "chain": 8453,
      "token": "USDC", 
      "amount": "970303",
      "amountFormatted": "0.970303",
      "address": "0xYourAddress"
    },
    "fees": {
      "total": 29697,
      "totalUSD": 0.0297,
      "breakdown": [
        {
          "name": "LIFI Fixed Fee",
          "amount": "2500",
          "amountUSD": "0.0025",
          "description": "Fixed LIFI fee"
        }
      ]
    },
    "gas": {
      "estimatedCost": "0.0016",
      "gasLimit": "0x5121f",
      "gasPrice": "0x72bd2b494"
    },
    "execution": {
      "estimatedTime": 3,
      "tool": "relay",
      "toolName": "Relay"
    }
  },
  "transaction": {
    "to": "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
    "data": "0x25d374e8...",
    "value": "0x0",
    "gasLimit": "0x5121f",
    "gasPrice": "0x72bd2b494",
    "chainId": 137
  },
  "rawData": { /* Original LiFi response for debugging */ }
}
```

## 🔗 Frontend Integration

### Example: Complete Transfer Flow

```javascript
// 1. Get transfer quote
const response = await fetch('http://localhost:3000/transfer?' + new URLSearchParams({
  fromChain: '137',        // Polygon
  toChain: '8453',         // Base
  fromToken: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC on Polygon
  toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // USDC on Base
  amount: '1000000',       // 1 USDC
  fromAddress: '0xYourAddress',
  toAddress: '0xYourAddress',
  fromAmount: '1000000',
  order: 'FASTEST'
}));

const quote = await response.json();

if (!quote.success) {
  console.error('Error:', quote.error);
  return;
}

// 2. Display transfer details to user
console.log(`Sending: ${quote.transfer.from.amountFormatted} ${quote.transfer.from.token}`);
console.log(`Receiving: ${quote.transfer.to.amountFormatted} ${quote.transfer.to.token}`);
console.log(`Total Fees: $${quote.transfer.fees.totalUSD}`);
console.log(`Estimated Time: ${quote.transfer.execution.estimatedTime} seconds`);

// 3. Execute transaction using your SignerService
const txResponse = await signerService.sendTransaction({
  chainId: quote.transaction.chainId,
  to: quote.transaction.to,
  data: quote.transaction.data,
  value: quote.transaction.value,
  gasLimit: quote.transaction.gasLimit,
  gasPrice: quote.transaction.gasPrice
});

console.log('Transaction sent:', txResponse.hash);

// 4. Wait for cross-chain completion
setTimeout(() => {
  console.log('USDC should now be available on destination chain!');
}, quote.transfer.execution.estimatedTime * 1000);
```

### Using with Different Wallets

**MetaMask:**
```javascript
await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [quote.transaction]
});
```

**Ethers.js:**
```javascript
const txResponse = await wallet.sendTransaction(quote.transaction);
```

**Web3.js:**
```javascript
const receipt = await web3.eth.sendTransaction(quote.transaction);
```

## 🌐 CORS Configuration

The API is configured with permissive CORS settings for easy development:

- ✅ **All origins allowed** (`*`)
- ✅ **All HTTP methods** (GET, POST, PUT, DELETE, OPTIONS)
- ✅ **No authentication required**
- ✅ **Large payload support** (10MB limit)

## 🔧 Common Chain & Token Addresses

### Popular Chains
- **Ethereum**: `1`
- **Polygon**: `137` 
- **Base**: `8453`
- **Arbitrum**: `42161`
- **Optimism**: `10`

### USDC Token Addresses
- **Polygon**: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` (Native USDC)
- **Base**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Ethereum**: `0xA0b86a33E6441d5F477FcF8A7B5b58E7F6dC9A3F`
- **Arbitrum**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

## 🚨 Important Notes

1. **Amount Format**: Always use the smallest unit (e.g., 1000000 = 1 USDC with 6 decimals)
2. **Gas Fees**: User pays gas on the source chain only
3. **Bridge Fees**: Included in the quote response
4. **Execution Time**: Typically 30 seconds to 5 minutes depending on bridge
5. **Transaction Signing**: Frontend must sign and submit the `transaction` object

## 🔍 Error Handling

**Missing Parameters:**
```json
{
  "error": "Missing required parameters"
}
```

**API Failure:**
```json
{
  "success": false,
  "error": "Failed to get transfer quote", 
  "message": "Detailed error message"
}
```

## 🛠️ Development

**Run tests:**
```bash
npm test
```

**Type checking:**
```bash
npx tsc --noEmit
```

**API Testing:**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test chains endpoint  
curl http://localhost:3000/chains

# Test transfer quote
curl "http://localhost:3000/transfer?fromChain=137&toChain=8453&fromToken=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359&toToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&amount=1000000&fromAddress=0xE09883Cb3Fe2d973cEfE4BB28E3A3849E7e5f0A7&toAddress=0xE09883Cb3Fe2d973cEfE4BB28E3A3849E7e5f0A7&fromAmount=1000000&order=FASTEST"
```

---

**Ready to use!** 🎉 Your API is now fully configured with no CORS restrictions and comprehensive documentation for easy frontend integration.