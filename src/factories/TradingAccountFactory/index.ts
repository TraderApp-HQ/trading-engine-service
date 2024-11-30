/* eslint-disable @typescript-eslint/no-extraneous-class */
import { TradingPlatform } from "../../config/enums";
import BinanceAccountService from "../../services/BinanceAccountService/index";
import { ITradingAccountInput } from "../BaseTradingAccount";
import { ITradingAccount } from "../interfaces";

class TradingAccountFactory {
	static initTradingAccount(input: ITradingAccountInput): ITradingAccount {
		switch (input.platformName) {
			case TradingPlatform.BINANCE: {
				return new BinanceAccountService(input);
			}
			default:
				throw new Error("Unsupported trading platform");
		}
	}
}

export default TradingAccountFactory;