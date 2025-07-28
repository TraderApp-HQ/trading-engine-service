type TradeSide = "LONG" | "SHORT";
interface CalculateLeverageInput {
	entryPrice: number;
	liquidationPrice: number;
	tradeSide: TradeSide;
	maintenanceMarginRate?: number;
}

/**
 * Calculate leverage for a futures position (LONG or SHORT)
 *
 * For LONG:
 *    L = 1 / ((1 + m) - (Pl / P0))
 *
 * For SHORT:
 *    L = 1 / ((Pl / P0) - (1 - m))
 *
 * @param entryPrice - Entry price (P0)
 * @param liquidationPrice - Liquidation price (Pl)
 * @param tradeSide - "LONG" or "SHORT"
 * @param maintenanceMarginRate - Maintenance margin rate (default 0.004 for Binance BTC small positions)
 * @returns Leverage (number)
 */
function calculateLeverage(input: CalculateLeverageInput): number {
	const { entryPrice, liquidationPrice, tradeSide, maintenanceMarginRate = 0.004 } = input;

	if (entryPrice <= 0 || liquidationPrice <= 0) {
		throw new Error("Entry price and liquidation price must be greater than zero.");
	}

	const ratio = liquidationPrice / entryPrice;
	let denominator: number;

	if (tradeSide === "LONG") {
		denominator = 1 + maintenanceMarginRate - ratio;
	} else if (tradeSide === "SHORT") {
		denominator = ratio - (1 - maintenanceMarginRate);
	} else {
		throw new Error("Invalid trade side. Must be 'LONG' or 'SHORT'.");
	}

	if (denominator <= 0) {
		throw new Error("Invalid values: denominator is zero or negative. Check inputs.");
	}

	return Math.floor(1 / denominator);
}

(async function () {
	// Example usage:
	const entryPrice = 3740;
	const liquidationPrice = 3920;
	const leverage = calculateLeverage({
		entryPrice,
		liquidationPrice,
		tradeSide: "SHORT",
	});

	console.log(`Calculated Leverage: ${leverage}x`);
})();
