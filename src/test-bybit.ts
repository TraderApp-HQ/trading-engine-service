import { BybitFuturesClient } from "./clients/BybitFuturesClient";

(async function () {
	// For DEMO TRADING (paper trading with demo API keys from mainnet)
	const client = new BybitFuturesClient({
		apiKey: process.env.BYBIT_DEMO_API_KEY || "M798lk3UQecE8mH5rL",
		apiSecret: process.env.BYBIT_DEMO_API_SECRET || "hOcqN9aiozWKMaJrFfEQw9cAwLtoRXi6a4mn",
		environment: "demo", // <-- Use "demo" for paper trading
	});

	try {
		// Get user information (includes userId)
		// console.log("========== Getting User Info (includes userId) ==========");
		// const userInfo = await client.getUserInfo();
		// console.log("User ID:", userInfo.userID);
		// console.log("API Key:", userInfo.apiKey);
		// console.log("VIP Level:", userInfo.vipLevel);
		// console.log("KYC Level:", userInfo.kycLevel);
		// console.log("Full User Info:", JSON.stringify(userInfo, null, 2));

		// console.log("\n========== 1. Get Account Information ==========");
		// const accountInfo = await client.getAccountInfo("UNIFIED");
		// console.log("Account Info:", JSON.stringify(accountInfo, null, 2));

		// // Access account details
		// if (accountInfo.list && accountInfo.list.length > 0) {
		// 	const account = accountInfo.list[0];
		// 	console.log("\nTotal Equity:", account.totalEquity);
		// 	console.log("Available Balance:", account.totalAvailableBalance);

		// 	// Show coin balances
		// 	account.coin.forEach((coin) => {
		// 		if (parseFloat(coin.walletBalance) > 0) {
		// 			console.log(`${coin.coin}: ${coin.walletBalance}`);
		// 		}
		// 	});
		// }

		// console.log("\n========== 2. Place Market Order ==========");
		// const marketOrder = await client.placeMarketOrder({
		// 	symbol: "BTCUSDT",
		// 	side: "Buy",
		// 	qty: "0.01",
		// 	leverage: 60,
		// });
		// console.log("Market Order Response:", marketOrder);
		// console.log("Order ID:", marketOrder.orderId);

		// console.log("\n========== 3. Place Limit Order ==========");
		// const limitOrder = await client.placeLimitOrder({
		// 	symbol: "BNBUSDT",
		// 	side: "Sell",
		// 	qty: "0.5",
		// 	price: "1000",
		// 	leverage: 40
		// });
		// console.log("Limit Order Response:", limitOrder);
		// console.log("Order ID:", limitOrder.orderId);

		// console.log("\n========== 4. Get All Positions ==========");
		// const allPositions = await client.getPositions();
		// console.log("All Positions:", JSON.stringify(allPositions, null, 2));

		// if (allPositions.list && allPositions.list.length > 0) {
		// 	allPositions.list.forEach((pos) => {
		// 		if (parseFloat(pos.size) !== 0) {
		// 			console.log(`\nPosition: ${pos.symbol}`);
		// 			console.log(`Side: ${pos.side}`);
		// 			console.log(`Size: ${pos.size}`);
		// 			console.log(`Entry Price: ${pos.entryPrice}`);
		// 			console.log(`Mark Price: ${pos.markPrice}`);
		// 			console.log(`Unrealised PnL: ${pos.unrealisedPnl}`);
		// 			console.log(`Leverage: ${pos.leverage}x`);
		// 		}
		// 	});
		// }

		// console.log("\n========== 5. Get Specific Symbol Position ==========");
		// const openPositions = await client.getOpenPositions();
		// console.log("Open Positions:", JSON.stringify(openPositions, null, 2));

		// get open position for symbol
		// const btcOpenPosition = await client.getOpenPosition("BTCUSDT");
		// console.log("BTC Open Position:", JSON.stringify(btcOpenPosition, null, 2));

		// const ethOpenPosition = await client.getOpenPosition("ETHUSDT");
		// console.log("ETH Open Position:", JSON.stringify(ethOpenPosition, null, 2));

		// console.log("\n========== 6. Set Leverage ==========");
		// await client.setLeverage("BTCUSDT", "20", "20");
		// console.log("Leverage set to 20x for BTCUSDT");

		// console.log("\n========== 7. Advanced: Place Order with Custom Parameters ==========");
		// const advancedOrder = await client.placeOrder({
		// 	symbol: "BTCUSDT",
		// 	side: "Sell",
		// 	orderType: "Limit",
		// 	qty: "0.002",
		// 	price: "70000",
		// 	leverage: 15,
		// 	positionIdx: 0, // One-way mode
		// 	timeInForce: "GTC", // Good Till Cancel
		// 	reduceOnly: false,
		// });
		// console.log("Advanced Order:", advancedOrder);

		// Uncomment to close a position
		// console.log("\n========== 8. Close Position ==========");
		// const closeOrder = await client.closePosition({
		// 	symbol: "BNBUSDT",
		// 	side: "Sell",
		// 	qty: "0.5",
		// });
		// console.log("Close Order:", closeOrder);

		// // Method 2: Position-level SL/TP (recommended for Bybit)
		// await client.setPositionStopLossTakeProfit({
		// 	symbol: "BTCUSDT",
		// 	stopLoss: "105500",
		// 	takeProfit: "111000",
		// });
		// console.log("Set Position Stop Loss Take Profit");

		// Get order by order ID
		const order = await client.getOrderById({
			symbol: "BTCUSDT",
			orderId: "2cb82ee5-0edd-4899-b2c3-00d3d4d9f230",
		});
		console.log("Order", { order });

		// // Get order by custom order link ID
		// const order2 = await client.getOrderById({
		// 	symbol: "BTCUSDT",
		// 	orderLinkId: "my-custom-id-123",
		// });
		// console.log("Order2", { order2 });
		// // Get all open orders for a symbol
		// const openOrders = await client.getOpenOrders("BTCUSDT");
		// console.log("Open Orders", { openOrders });
		// // Get order history
		// const history = await client.getOrderHistory({
		// 	symbol: "BTCUSDT",
		// 	limit: 100,
		// });
		// console.log("History", { history });
		// // Cancel an order
		// await client.cancelOrder({
		// 	symbol: "BTCUSDT",
		// 	orderId: "1234567890",
		// });
		// console.log("Cancel Order");
		// // Cancel all orders for a symbol
		// await client.cancelAllOrders("BTCUSDT");
		// console.log("Cancel All Orders");
	} catch (error: any) {
		console.error("\n❌ Error:", error.message);
		console.error("Full error:", error);
	}
})();
