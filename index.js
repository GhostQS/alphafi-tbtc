#!/usr/bin/env node

// Query tBTC totals on AlphaFi (AlphaLend) using the official SDK
// Coin type provided by user: 0x77045f1b9f811a7a8fb9ebd085b5b0c55c5cb0d1520ff55f7037f89b5da9f5f1::TBTC::TBTC

const { SuiClient } = require("@mysten/sui/client");
const { AlphalendClient } = require("@alphafi/alphalend-sdk");

const TBTC_COIN_TYPE =
  "0x77045f1b9f811a7a8fb9ebd085b5b0c55c5cb0d1520ff55f7037f89b5da9f5f1::TBTC::TBTC";

async function main() {
  const suiClient = new SuiClient({ url: "https://rpc.mainnet.sui.io" });
  const alphalendClient = new AlphalendClient("mainnet", suiClient);

  // If called with --json, output only the TBTC market JSON (marketId 14) and exit
  if (process.argv.includes("--json")) {
    const market14 = await alphalendClient.getMarketDataFromId(14);
    console.log(JSON.stringify(market14));
    return;
  }

  console.log("Fetching AlphaLend markets ...");
  const markets = await alphalendClient.getAllMarkets();

  const tbtcMarkets = markets.filter((m) => m.coinType === TBTC_COIN_TYPE);

  if (tbtcMarkets.length === 0) {
    console.log("No markets found for TBTC coin type on AlphaLend.");
    console.log("Checked coin type:", TBTC_COIN_TYPE);
    return;
  }

  // Sum totals across any markets matching TBTC (usually 1 market)
  const toStr = (x) => (typeof x?.toString === "function" ? x.toString() : String(x));

  let totalSupplySum = 0n;
  let totalBorrowSum = 0n;
  let availableLiquiditySum = 0n;

  for (const m of tbtcMarkets) {
    // SDK returns Decimal for many fields. We also output per-market data for clarity.
    console.log("--- TBTC Market ---");
    console.log("marketId:", m.marketId);
    console.log("coinType:", m.coinType);
    console.log("decimals:", m.decimalDigit);
    console.log("price (USD):", toStr(m.price));
    console.log("totalSupply:", toStr(m.totalSupply));
    console.log("totalBorrow:", toStr(m.totalBorrow));
    console.log("availableLiquidity:", toStr(m.availableLiquidity));
    console.log("supplyApr (interest):", toStr(m.supplyApr?.interestApr));
    console.log(
      "supplyApr (rewards):",
      (m.supplyApr?.rewards || []).map((r) => ({ coinType: r.coinType, rewardApr: toStr(r.rewardApr) }))
    );

    // For the sum, try to coerce Decimal -> string -> BigInt scaled by decimals if needed.
    // The SDK describes totalSupply as a Decimal amount in lowest denomination.
    // We'll attempt to BigInt if it's integer-like; otherwise skip from sum but still print per-market.
    try {
      const supplyStr = toStr(m.totalSupply);
      const borrowStr = toStr(m.totalBorrow);
      const liqStr = toStr(m.availableLiquidity);

      if (/^\d+$/.test(supplyStr)) totalSupplySum += BigInt(supplyStr);
      if (/^\d+$/.test(borrowStr)) totalBorrowSum += BigInt(borrowStr);
      if (/^\d+$/.test(liqStr)) availableLiquiditySum += BigInt(liqStr);
    } catch (e) {
      // ignore sum issues
    }
  }

  console.log("\n=== Aggregated TBTC Totals on AlphaLend ===");
  console.log("Total Supply (raw units):", totalSupplySum.toString());
  console.log("Total Borrow (raw units):", totalBorrowSum.toString());
  console.log("Available Liquidity (raw units):", availableLiquiditySum.toString());

  // Also compute human-readable supplies per market using decimals
  console.log("\nTip: Divide raw units by 10^decimals to get human units.");

  // Fetch detailed market data for marketId 14 (TBTC market)
  console.log("\n=== Market 14 Detailed Data (TBTC) ===");
  const market14 = await alphalendClient.getMarketDataFromId(14);

  // Helper to safely convert Decimal-like values to string
  const decToStr = (v) => (typeof v?.toString === "function" ? v.toString() : String(v));

  // Print a curated view of the market data
  console.log("marketId:", market14.marketId);
  console.log("coinType:", market14.coinType);
  console.log("decimals:", market14.decimalDigit);
  console.log("price (USD):", decToStr(market14.price));
  console.log("ltv:", decToStr(market14.ltv));
  console.log("liquidationThreshold:", decToStr(market14.liquidationThreshold));
  console.log("totalSupply:", decToStr(market14.totalSupply));
  console.log("totalBorrow:", decToStr(market14.totalBorrow));
  console.log("availableLiquidity:", decToStr(market14.availableLiquidity));
  console.log("borrowFee:", decToStr(market14.borrowFee));
  console.log("xtokenRatio:", decToStr(market14.xtokenRatio));
  console.log("supplyApr (interest):", decToStr(market14.supplyApr?.interestApr));
  console.log(
    "supplyApr (rewards):",
    (market14.supplyApr?.rewards || []).map((r) => ({ coinType: r.coinType, rewardApr: decToStr(r.rewardApr) }))
  );
  console.log("borrowApr (interest):", decToStr(market14.borrowApr?.interestApr));

  // Dump full market JSON for complete visibility
  console.log("\n=== Full Market 14 JSON ===");
  console.log(JSON.stringify(market14, null, 2));

  // Compute USD TVL metrics using the SDK-provided price
  const priceUsd = parseFloat(decToStr(market14.price));
  const supplyHuman = parseFloat(decToStr(market14.totalSupply));
  const borrowHuman = parseFloat(decToStr(market14.totalBorrow));
  const availableHuman = parseFloat(decToStr(market14.availableLiquidity));

  const supplyUsd = supplyHuman * priceUsd;
  const borrowUsd = borrowHuman * priceUsd;
  const availableUsd = availableHuman * priceUsd;
  const netUsd = (supplyHuman - borrowHuman) * priceUsd;

  console.log("\n=== TBTC USD Metrics (Market 14) ===");
  console.log("priceUsd:", priceUsd);
  console.log("totalSupply (TBTC):", supplyHuman);
  console.log("totalBorrow (TBTC):", borrowHuman);
  console.log("availableLiquidity (TBTC):", availableHuman);
  console.log("totalSupplyUsd:", supplyUsd);
  console.log("totalBorrowUsd:", borrowUsd);
  console.log("availableLiquidityUsd:", availableUsd);
  console.log("netLiquidityUsd (supply - borrow):", netUsd);
}

main().catch((err) => {
  console.error("Error while fetching TBTC data:", err);
  process.exit(1);
});
