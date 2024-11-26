import { Category, TradingPlatform } from "./enums";
import { ITradingPlatform } from "./interfaces";

export const TradingPlatforms: ITradingPlatform[] = [
	{
		name: TradingPlatform.BINANCE,
		id: 270,
		logo: "https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png",
		category: Category.CRYPTO,
	},
];
