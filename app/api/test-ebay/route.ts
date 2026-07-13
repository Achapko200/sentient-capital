export async function GET() {
  const appId  = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  
  if (!appId || !certId) {
    return Response.json({ error: "Missing credentials", appId: !!appId, certId: !!certId });
  }

  try {
    const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");
    const tokenRes = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method:  "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type":  "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return Response.json({ error: "Token failed", details: tokenData });

    const token     = tokenData.access_token;
    const query     = encodeURIComponent("Kyle Schwarber PSA 10 rookie card");
    const searchRes = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&sort=endDateRecent&limit=5`,
      {
        headers: {
          "Authorization":           `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
      }
    );

    const searchData = await searchRes.json();
    return Response.json({ 
      tokenOk:      true, 
      searchStatus: searchRes.status,
      items:        searchData.itemSummaries?.slice(0,3) ?? [],
      total:        searchData.total,
      errors:       searchData.errors,
    });
  } catch (err: any) {
    return Response.json({ error: err.message });
  }
}
