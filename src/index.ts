import express, { Request, response, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const base_url="https://li.quest/v1"

const headers={
  "Content-Type": "application/json",
  "x-lifi-api-key": process.env.API_KEY || "e8d8d96e-c3b2-4e69-b056-8f1b77182e86.98d02c95-9c1c-4d80-87ea-9838f2f52b43"
}



async function _get_supported_chains(){
  try{
  const response=await fetch(`${base_url}/chains`,{
    method:"GET",
    headers
  })
  const data=await response.json()
  console.log(data)
  return data
  }catch(error){
    console.error("Error fetching supported chains:", error)
    return []
  }
}



async function _order(fromChain:string,toChain:string,fromToken:string,toToken:string,amount:number,fromAddress:string,toAddress:string,fromAmount:number, order="FASTEST"){

  try{
    const response=await fetch(`${base_url}/quote?fromChain=${fromChain}&toChain=${toChain}&fromToken=${fromToken}&toToken=${toToken}&amount=${amount}&fromAddress=${fromAddress}&toAddress=${toAddress}&fromAmount=${fromAmount}&order=${order}`,{
      method:"GET",
      headers,
     
    })
    const data=await response.json()
    return data
  }catch(error){
    console.error("Error ordering:", error)
    return []
  }
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'crosschain-usdc-api'
  });
});




app.get("/chains",async(req:Request,res:Response)=>{
  try{
    const chains= await _get_supported_chains()
    console.log(chains)
    res.json(chains)
  }catch(error){
    res.status(500).json({error:"Failed to fetch chains"})
  }
})

app.get("/transfer",async(req:Request,res:Response)=>{
  try{
    const {fromChain,toChain,fromToken,toToken,amount,fromAddress,toAddress,fromAmount,order} = req.query
    //make sure all are required
    if(!fromChain || !toChain || !fromToken || !toToken || !amount || !fromAddress || !toAddress || !fromAmount || !order){
      return res.status(400).json({error:"Missing required parameters"})
    }
    //make sure fromChain and toChain are valid chains
    const data=await _order(fromChain as string,toChain as string,fromToken as string,toToken as string,Number(amount as string),fromAddress as string,toAddress as string,Number(fromAmount as string) ,order as string) as any
    
    // Format response for frontend
    const formattedResponse = {
      success: true,
      transfer: {
        from: {
          chain: data.action?.fromChainId || fromChain,
          token: data.action?.fromToken?.symbol || "Unknown",
          amount: data.action?.fromAmount || amount,
          amountFormatted: data.action?.fromAmount ? (Number(data.action.fromAmount) / Math.pow(10, data.action.fromToken?.decimals || 6)).toFixed(6) : "0",
          address: fromAddress
        },
        to: {
          chain: data.action?.toChainId || toChain,
          token: data.action?.toToken?.symbol || "Unknown", 
          amount: data.estimate?.toAmount || "0",
          amountFormatted: data.estimate?.toAmount ? (Number(data.estimate.toAmount) / Math.pow(10, data.action?.toToken?.decimals || 6)).toFixed(6) : "0",
          address: toAddress
        },
        fees: {
          total: data.estimate?.feeCosts?.reduce((sum: number, fee: any) => sum + Number(fee.amount || 0), 0) || 0,
          totalUSD: data.estimate?.feeCosts?.reduce((sum: number, fee: any) => sum + Number(fee.amountUSD || 0), 0) || 0,
          breakdown: data.estimate?.feeCosts?.map((fee: any) => ({
            name: fee.name,
            amount: fee.amount,
            amountUSD: fee.amountUSD,
            description: fee.description
          })) || []
        },
        gas: {
          estimatedCost: data.estimate?.gasCosts?.[0]?.amountUSD || "0",
          gasLimit: data.transactionRequest?.gasLimit || "0",
          gasPrice: data.transactionRequest?.gasPrice || "0"
        },
        execution: {
          estimatedTime: data.estimate?.executionDuration || 0,
          tool: data.tool || "Unknown",
          toolName: data.toolDetails?.name || "Unknown Bridge"
        }
      },
      transaction: {
        to: data.transactionRequest?.to,
        data: data.transactionRequest?.data,
        value: data.transactionRequest?.value || "0x0",
        gasLimit: data.transactionRequest?.gasLimit,
        gasPrice: data.transactionRequest?.gasPrice,
        chainId: data.transactionRequest?.chainId || fromChain
      },
      rawData: data // Include original response for debugging
    }
    
    res.json(formattedResponse)
  }
  catch(error){
    res.status(500).json({
      success: false,
      error: "Failed to get transfer quote",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})



// Basic Routes
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Crossc Chain Service is running on port ${PORT}`);
});
