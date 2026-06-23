// ─── lib/amm.ts ──────────────────────────────────────────────────────────────
// Constant product AMM: price = usdc_reserve / share_reserve
// Same formula as Uniswap x*y=k

import { supabaseAdmin } from "@/lib/supabase-server";

export type Pool = {
  cardId:       string;
  usdcReserve:  number;
  shareReserve: number;
};

// ─── Get or create pool for a card ───────────────────────────────────────────
export async function getPool(cardId: string, initialPrice = 3.00): Promise<Pool> {
  const { data } = await supabaseAdmin
    .from("market_pools")
    .select()
    .eq("card_id", cardId)
    .single();

  if (data) {
    return {
      cardId:       data.card_id,
      usdcReserve:  data.usdc_reserve,
      shareReserve: data.share_reserve,
    };
  }

  // Create new pool — seed with initial price
  // price = usdcReserve / shareReserve → usdcReserve = price * shareReserve
  const shareReserve = 1000;
  const usdcReserve  = initialPrice * shareReserve;

  await supabaseAdmin.from("market_pools").insert({
    card_id:       cardId,
    usdc_reserve:  usdcReserve,
    share_reserve: shareReserve,
  });

  return { cardId, usdcReserve, shareReserve };
}

// ─── Get current market price ─────────────────────────────────────────────────
export function getPrice(pool: Pool): number {
  return Math.round((pool.usdcReserve / pool.shareReserve) * 100) / 100;
}

// ─── Calculate how much USDC you get for selling N shares ────────────────────
export function calcSellReturn(pool: Pool, sharesToSell: number): number {
  // x * y = k
  // (usdcReserve - usdcOut) * (shareReserve + sharesToSell) = k
  const k       = pool.usdcReserve * pool.shareReserve;
  const newShareReserve = pool.shareReserve + sharesToSell;
  const newUsdcReserve  = k / newShareReserve;
  const usdcOut = pool.usdcReserve - newUsdcReserve;
  return Math.round(usdcOut * 100) / 100;
}

// ─── Calculate how many shares you get for spending N USDC ───────────────────
export function calcBuyReturn(pool: Pool, usdcIn: number): number {
  const k            = pool.usdcReserve * pool.shareReserve;
  const newUsdcReserve  = pool.usdcReserve + usdcIn;
  const newShareReserve = k / newUsdcReserve;
  const sharesOut    = pool.shareReserve - newShareReserve;
  return Math.round(sharesOut * 10) / 10;
}

// ─── Execute a sell (user sells shares back to the market) ───────────────────
export async function sellToMarket(
  cardId:  string,
  wallet:  string,
  shares:  number,
): Promise<{ usdcReceived: number; newPrice: number }> {
  const pool    = await getPool(cardId);
  const usdcOut = calcSellReturn(pool, shares);

  if (usdcOut <= 0) throw new Error("Insufficient pool liquidity");

  const newShareReserve = pool.shareReserve + shares;
  const newUsdcReserve  = pool.usdcReserve - usdcOut;

  // Update pool
  await supabaseAdmin.from("market_pools").update({
    usdc_reserve:  newUsdcReserve,
    share_reserve: newShareReserve,
  }).eq("card_id", cardId);

  // Update user position
  const { data: pos } = await supabaseAdmin
    .from("positions")
    .select()
    .eq("wallet", wallet)
    .eq("card_id", cardId)
    .single();

  if (!pos || pos.shares < shares) throw new Error("Insufficient shares");

  const remaining = pos.shares - shares;
  if (remaining === 0) {
    await supabaseAdmin.from("positions")
      .delete().eq("wallet", wallet).eq("card_id", cardId);
  } else {
    await supabaseAdmin.from("positions")
      .update({ shares: remaining }).eq("wallet", wallet).eq("card_id", cardId);
  }

  // Record trade
  await supabaseAdmin.from("trades").insert({
    id:          `trd_amm_${Date.now()}`,
    card_id:     cardId,
    price:       Math.round((usdcOut / shares) * 100) / 100,
    shares,
    buy_wallet:  "AMM_POOL",
    sell_wallet: wallet,
    executed_at: new Date().toISOString(),
  });

  const newPrice = Math.round((newUsdcReserve / newShareReserve) * 100) / 100;
  return { usdcReceived: usdcOut, newPrice };
}

// ─── Execute a buy from the market pool ──────────────────────────────────────
export async function buyFromMarket(
  cardId:  string,
  wallet:  string,
  usdcIn:  number,
): Promise<{ sharesReceived: number; newPrice: number }> {
  const pool      = await getPool(cardId);
  const sharesOut = calcBuyReturn(pool, usdcIn);

  if (sharesOut <= 0) throw new Error("Insufficient pool liquidity");

  const newUsdcReserve  = pool.usdcReserve + usdcIn;
  const newShareReserve = pool.shareReserve - sharesOut;

  await supabaseAdmin.from("market_pools").update({
    usdc_reserve:  newUsdcReserve,
    share_reserve: newShareReserve,
  }).eq("card_id", cardId);

  // Update user position
  const { data: pos } = await supabaseAdmin
    .from("positions")
    .select()
    .eq("wallet", wallet)
    .eq("card_id", cardId)
    .single();

  if (pos) {
    const totalShares = pos.shares + sharesOut;
    const avgCost     = ((pos.avg_cost * pos.shares) + (usdcIn)) / totalShares;
    await supabaseAdmin.from("positions")
      .update({ shares: totalShares, avg_cost: avgCost })
      .eq("wallet", wallet).eq("card_id", cardId);
  } else {
    await supabaseAdmin.from("positions").insert({
      wallet, card_id: cardId,
      shares:   sharesOut,
      avg_cost: usdcIn / sharesOut,
    });
  }

  await supabaseAdmin.from("trades").insert({
    id:          `trd_amm_${Date.now()}`,
    card_id:     cardId,
    price:       Math.round((usdcIn / sharesOut) * 100) / 100,
    shares:      sharesOut,
    buy_wallet:  wallet,
    sell_wallet: "AMM_POOL",
    executed_at: new Date().toISOString(),
  });

  const newPrice = Math.round((newUsdcReserve / newShareReserve) * 100) / 100;
  return { sharesReceived: sharesOut, newPrice };
}

// ─── Get price impact of a trade ─────────────────────────────────────────────
export function getPriceImpact(pool: Pool, shares: number, side: "buy" | "sell"): number {
  const currentPrice = getPrice(pool);
  let newPrice: number;

  if (side === "sell") {
    const usdcOut         = calcSellReturn(pool, shares);
    const newShareReserve = pool.shareReserve + shares;
    const newUsdcReserve  = pool.usdcReserve - usdcOut;
    newPrice = newUsdcReserve / newShareReserve;
  } else {
    const usdcIn          = shares * currentPrice;
    const sharesOut       = calcBuyReturn(pool, usdcIn);
    const newUsdcReserve  = pool.usdcReserve + usdcIn;
    const newShareReserve = pool.shareReserve - sharesOut;
    newPrice = newUsdcReserve / newShareReserve;
  }

  return Math.round(((newPrice - currentPrice) / currentPrice) * 1000) / 10;
}