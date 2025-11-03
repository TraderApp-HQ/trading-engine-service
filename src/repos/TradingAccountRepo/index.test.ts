import TradingAccountRepository from "./index";
import UserTradingAccount from "../../models/UserTradingAccount";
import UserTradingAccountBalance from "../../models/UserTradingAccountBalance";
import {
	AccountConnectionStatus,
	AccountType,
	Category,
	ConnectionType,
	Currency,
	TradingPlatform,
} from "../../config/enums";
import { ITradingAccountInfo } from "../../factories/interfaces";

const mockCheckToggleFlag = jest.fn().mockResolvedValue(false);
jest.mock("../../clients/SplitIOClient", () => {
	return {
		FeatureFlagManager: function () {
			return {
				checkToggleFlag: mockCheckToggleFlag,
			};
		},
	};
});

describe("TradingAccountRepository", () => {
	let repository: TradingAccountRepository;
	const mockAccountInfo: ITradingAccountInfo = {
		accountId: "test-account-id",
		userId: "user123",
		platformName: TradingPlatform.BINANCE,
		platformId: 112,
		platformLogo: "binance-logo.png",
		apiKey: "test-api-key",
		apiSecret: "test-api-secret",
		externalAccountUserId: "external123",
		isWithdrawalEnabled: false,
		isFuturesTradingEnabled: true,
		isSpotTradingEnabled: true,
		isIpAddressWhitelisted: true,
		connectionStatus: AccountConnectionStatus.CONNECTED,
		errorMessages: [],
		category: Category.CRYPTO,
		connectionType: ConnectionType.MANUAL,
		balances: [
			{
				currency: Currency.USDT,
				accountType: AccountType.FUTURES,
				availableBalance: 120,
				lockedBalance: 10,
			},
			{
				currency: Currency.USDT,
				accountType: AccountType.SPOT,
				availableBalance: 50,
				lockedBalance: 10,
			},
		],
	};

	beforeEach(() => {
		repository = new TradingAccountRepository();
		mockCheckToggleFlag.mockClear();
		mockCheckToggleFlag.mockResolvedValue(false);
	});

	afterEach(async () => {
		jest.clearAllMocks();
	});

	describe("processUserTradingAccountInfo", () => {
		it("should successfully process user trading account info with valid data", async () => {
			await repository.processUserTradingAccountInfo(mockAccountInfo, {
				isIpAddressWhitelistRequired: true,
			});

			// Verify the trading account was created
			const account = await UserTradingAccount.findOne({
				userId: mockAccountInfo.userId,
				platformName: mockAccountInfo.platformName,
			});

			expect(account).toBeTruthy();
			expect(account?.userId).toBe(mockAccountInfo.userId);
			expect(account?.platformName).toBe(mockAccountInfo.platformName);
			expect(account?.connectionStatus).toBe(AccountConnectionStatus.CONNECTED);
			expect(account?.errorMessages).toHaveLength(0);
			expect(account?.apiKey).toBeTruthy(); // Should be encrypted
			expect(account?.apiSecret).toBeTruthy(); // Should be encrypted

			// Verify balances were created
			const balances = await UserTradingAccountBalance.find({
				userId: mockAccountInfo.userId,
				platformName: mockAccountInfo.platformName,
			});

			expect(balances).toHaveLength(2);

			const futuresBalance = balances.find((b) => b.accountType === AccountType.FUTURES);
			const spotBalance = balances.find((b) => b.accountType === AccountType.SPOT);

			expect(futuresBalance?.availableBalance).toBe(120);
			expect(futuresBalance?.lockedBalance).toBe(10);
			expect(futuresBalance?.accountSize).toBe(200); // Should be computed
			expect(spotBalance?.availableBalance).toBe(50);
			expect(spotBalance?.lockedBalance).toBe(10);
			expect(spotBalance?.accountSize).toBe(100); // Should be computed

			// Verify feature flag was called
			expect(mockCheckToggleFlag).toHaveBeenCalledWith(
				"release-duplicate-trading-account-connection",
				"user123"
			);
		});

		it("should set FAILED status when health check fails", async () => {
			const invalidAccountInfo = {
				...mockAccountInfo,
				isWithdrawalEnabled: true, // This should cause health check to fail
				isFuturesTradingEnabled: false,
				isSpotTradingEnabled: false,
				isIpAddressWhitelisted: false,
				balances: [
					{
						currency: Currency.USDT,
						accountType: AccountType.FUTURES,
						availableBalance: 10, // Less than 50 USDT required
						lockedBalance: 0,
					},
				],
			};

			await repository.processUserTradingAccountInfo(invalidAccountInfo, {
				isIpAddressWhitelistRequired: true,
			});

			const account = await UserTradingAccount.findOne({
				userId: invalidAccountInfo.userId,
				platformName: invalidAccountInfo.platformName,
			});

			expect(account?.connectionStatus).toBe(AccountConnectionStatus.FAILED);
			// expect(account?.errorMessages).toContain("Withdrawal is enabled");
			expect(account?.errorMessages).toContain("FUTURES trading is not enabled");
			expect(account?.errorMessages).toContain("SPOT trading is not enabled");
			expect(account?.errorMessages).toContain(
				"TraderApp IP addresses haven't been whitelisted"
			);
			expect(account?.errorMessages).toContain(
				"Futures trading USDT balance is less than 50 USDT"
			);
		});

		it("should throw error when same external account is connected by different user (production mode)", async () => {
			// Mock feature flag to return false (production mode)
			mockCheckToggleFlag.mockResolvedValueOnce(false);

			// Create existing account with different user
			await new UserTradingAccount({
				userId: "different-user",
				platformName: mockAccountInfo.platformName,
				platformId: mockAccountInfo.platformId,
				externalAccountUserId: mockAccountInfo.externalAccountUserId,
				connectionStatus: AccountConnectionStatus.CONNECTED,
				category: Category.CRYPTO,
				connectionType: ConnectionType.MANUAL,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			await expect(
				repository.processUserTradingAccountInfo(mockAccountInfo, {
					isIpAddressWhitelistRequired: false,
				})
			).rejects.toThrow("Sorry, this account has already been connected by a different user");
		});

		it("should allow duplicate accounts in development mode", async () => {
			// Mock feature flag to return true (development mode)
			mockCheckToggleFlag.mockResolvedValueOnce(true);

			// Create existing account with different user
			await new UserTradingAccount({
				userId: "different-user",
				platformName: mockAccountInfo.platformName,
				platformId: mockAccountInfo.platformId,
				externalAccountUserId: mockAccountInfo.externalAccountUserId,
				connectionStatus: AccountConnectionStatus.CONNECTED,
				category: Category.CRYPTO,
				connectionType: ConnectionType.MANUAL,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			// Should not throw error in development mode
			await expect(
				repository.processUserTradingAccountInfo(mockAccountInfo, {
					isIpAddressWhitelistRequired: false,
				})
			).resolves.not.toThrow();
		});

		it("should archive existing account when connecting new account of same platform", async () => {
			// Ensure the feature flag returns false (so archiving is triggered)
			mockCheckToggleFlag.mockResolvedValueOnce(true);

			// Create existing account with a different externalAccountUserId
			const existingAccount = await new UserTradingAccount({
				userId: mockAccountInfo.userId,
				platformName: mockAccountInfo.platformName,
				platformId: mockAccountInfo.platformId,
				externalAccountUserId: "old-external-id", // different from mockAccountInfo.externalAccountUserId
				connectionStatus: AccountConnectionStatus.CONNECTED,
				category: Category.CRYPTO,
				connectionType: ConnectionType.MANUAL,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			// Create balance for existing account
			await new UserTradingAccountBalance({
				userId: mockAccountInfo.userId,
				tradingAccountId: existingAccount._id,
				platformName: mockAccountInfo.platformName,
				platformId: mockAccountInfo.platformId,
				currency: Currency.USDT,
				accountType: AccountType.FUTURES,
				availableBalance: 200,
				lockedBalance: 0,
			}).save();

			// Now connect a new account with a different externalAccountUserId
			await repository.processUserTradingAccountInfo(mockAccountInfo, {
				isIpAddressWhitelistRequired: false,
			});

			// Check old account is archived
			const archivedAccount = await UserTradingAccount.findById(existingAccount._id);
			expect(archivedAccount?.connectionStatus).toBe(AccountConnectionStatus.ARCHIVED);

			// Check old balances are deleted
			const oldBalances = await UserTradingAccountBalance.find({
				tradingAccountId: existingAccount._id,
			});
			expect(oldBalances).toHaveLength(0);

			// Check new account exists
			const newAccount = await UserTradingAccount.findOne({
				userId: mockAccountInfo.userId,
				platformName: mockAccountInfo.platformName,
				connectionStatus: { $ne: AccountConnectionStatus.ARCHIVED },
			});
			expect(newAccount?.externalAccountUserId).toBe(mockAccountInfo.externalAccountUserId);
		});

		it("should not archive account when reconnecting same external account", async () => {
			// Create existing account with same external ID
			const existingAccount = await new UserTradingAccount({
				userId: mockAccountInfo.userId,
				platformName: mockAccountInfo.platformName,
				platformId: mockAccountInfo.platformId,
				externalAccountUserId: mockAccountInfo.externalAccountUserId, // Same external ID
				connectionStatus: AccountConnectionStatus.CONNECTED,
				category: Category.CRYPTO,
				connectionType: ConnectionType.MANUAL,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			await repository.processUserTradingAccountInfo(mockAccountInfo, {
				isIpAddressWhitelistRequired: false,
			});

			// Check account is still connected (not archived)
			const account = await UserTradingAccount.findById(existingAccount._id);
			expect(account?.connectionStatus).toBe(AccountConnectionStatus.CONNECTED);
		});
	});

	describe("getUserTradingAccountsWithBalancesFromDb", () => {
		beforeEach(async () => {
			// Create test data
			const account = await new UserTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				externalAccountUserId: "external123",
				connectionStatus: AccountConnectionStatus.CONNECTED,
				category: Category.CRYPTO,
				connectionType: ConnectionType.MANUAL,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			await new UserTradingAccountBalance({
				userId: "user123",
				tradingAccountId: account._id,
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				currency: Currency.USDT,
				accountType: AccountType.FUTURES,
				availableBalance: 100,
				lockedBalance: 10,
				accountSize: 200,
			}).save();

			await new UserTradingAccountBalance({
				userId: "user123",
				tradingAccountId: account._id,
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				currency: Currency.BTC,
				accountType: AccountType.SPOT,
				availableBalance: 0.5,
				lockedBalance: 0.1,
				accountSize: 200,
			}).save();
		});

		it("should return user trading accounts with balances", async () => {
			const result = await repository.getUserTradingAccountsWithBalancesFromDb({
				userId: "user123",
			});

			expect(result).toHaveLength(1);
			expect(result[0]?.userId).toBe("user123");
			expect(result[0]?.platformName).toBe(TradingPlatform.BINANCE);
			expect(result[0]?.balances).toHaveLength(2);

			const usdtBalance = result[0]?.balances?.find((b) => b.currency === Currency.USDT);
			const btcBalance = result[0]?.balances?.find((b) => b.currency === Currency.BTC);

			expect(usdtBalance?.availableBalance).toBe(100);
			expect(usdtBalance?.accountSize).toBe(200);
			expect(btcBalance?.availableBalance).toBe(0.5);
		});

		it("should return empty array when no accounts found", async () => {
			const result = await repository.getUserTradingAccountsWithBalancesFromDb({
				userId: "nonexistent-user",
			});

			expect(result).toEqual([]);
		});

		it("should exclude archived accounts", async () => {
			// Archive the account
			await UserTradingAccount.updateOne(
				{ userId: "user123" },
				{ connectionStatus: AccountConnectionStatus.ARCHIVED }
			);

			const result = await repository.getUserTradingAccountsWithBalancesFromDb({
				userId: "user123",
			});

			expect(result).toEqual([]);
		});

		it("should handle multiple trading accounts for same user", async () => {
			// Create second account (Kucoin)
			const kucoinAccount = await new UserTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.KUCOIN,
				platformId: 113,
				externalAccountUserId: "kucoin-external-id",
				connectionStatus: AccountConnectionStatus.CONNECTED,
				category: Category.CRYPTO,
				connectionType: ConnectionType.FAST,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			await new UserTradingAccountBalance({
				userId: "user123",
				tradingAccountId: kucoinAccount._id,
				platformName: TradingPlatform.KUCOIN,
				platformId: 113,
				currency: Currency.USDT,
				accountType: AccountType.FUTURES,
				availableBalance: 300,
				lockedBalance: 0,
				accountSize: 500,
			}).save();

			const result = await repository.getUserTradingAccountsWithBalancesFromDb({
				userId: "user123",
			});

			expect(result).toHaveLength(2);

			const binanceAccount = result.find(
				(acc) => acc?.platformName === TradingPlatform.BINANCE
			);
			const kucoinAccountResult = result.find(
				(acc) => acc?.platformName === TradingPlatform.KUCOIN
			);

			expect(binanceAccount?.balances).toHaveLength(2);
			expect(kucoinAccountResult?.balances).toHaveLength(1);
			expect(kucoinAccountResult?.balances?.[0]?.availableBalance).toBe(300);
		});
	});

	describe("getUserTradingAccountWithBalancesFromDb", () => {
		beforeEach(async () => {
			const account = await new UserTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				externalAccountUserId: "external123",
				connectionStatus: AccountConnectionStatus.CONNECTED,
				category: Category.CRYPTO,
				connectionType: ConnectionType.MANUAL,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			await new UserTradingAccountBalance({
				userId: "user123",
				tradingAccountId: account._id,
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				currency: Currency.USDT,
				accountType: AccountType.FUTURES,
				availableBalance: 100,
				lockedBalance: 10,
				accountSize: 200,
			}).save();
		});

		it("should return specific trading account with balances", async () => {
			const result = await repository.getUserTradingAccountWithBalancesFromDb({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
			});

			expect(result.userId).toBe("user123");
			expect(result.platformName).toBe(TradingPlatform.BINANCE);
			expect(result.balances).toHaveLength(1);
			expect(result.balances?.[0]?.availableBalance).toBe(100);
			expect(result.balances?.[0]?.accountSize).toBe(200);
		});
	});

	describe("getUserTradingAccount", () => {
		it("should return user trading account with decrypted credentials", async () => {
			// Use the existing processUserTradingAccountInfo to create account with encryption
			await repository.processUserTradingAccountInfo(mockAccountInfo, {
				isIpAddressWhitelistRequired: true,
			});

			const result = await repository.getUserTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
			});

			expect(result).toBeTruthy();
			expect(result.userId).toBe("user123");
			expect(result.platformName).toBe(TradingPlatform.BINANCE);
			expect(result.apiKey).toBe("test-api-key"); // Should be decrypted
			expect(result.apiSecret).toBe("test-api-secret"); // Should be decrypted
		});

		it("should throw error when account not found", async () => {
			await expect(
				repository.getUserTradingAccount({
					userId: "nonexistent-user",
					platformName: TradingPlatform.BINANCE,
				})
			).rejects.toThrow("Trading account does not exist");
		});

		it("should exclude archived accounts", async () => {
			await new UserTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				externalAccountUserId: "external123",
				connectionStatus: AccountConnectionStatus.ARCHIVED, // Archived
				category: Category.CRYPTO,
				connectionType: ConnectionType.MANUAL,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			await expect(
				repository.getUserTradingAccount({
					userId: "user123",
					platformName: TradingPlatform.BINANCE,
				})
			).rejects.toThrow("Trading account does not exist");
		});
	});

	describe("addFundToTradingAccount", () => {
		beforeEach(async () => {
			const account = await new UserTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				externalAccountUserId: "external123",
				connectionStatus: AccountConnectionStatus.CONNECTED,
				category: Category.CRYPTO,
				connectionType: ConnectionType.MANUAL,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			await new UserTradingAccountBalance({
				userId: "user123",
				tradingAccountId: account._id,
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				currency: Currency.USDT,
				accountType: AccountType.FUTURES,
				availableBalance: 10,
				lockedBalance: 10,
			}).save();
		});

		it("should increment the available balance when adding funds", async () => {
			await repository.addFundToTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				accountType: AccountType.FUTURES,
				currency: Currency.USDT,
				amount: 15,
			});

			const balance = await UserTradingAccountBalance.findOne({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				accountType: AccountType.FUTURES,
				currency: Currency.USDT,
			});

			// Initial availableBalance: 10, after adding 15, should be 25
			expect(balance?.availableBalance).toBe(25);
		});

		it("should clear the error message if futures balance reaches 50 or more", async () => {
			// Set up the error message on the parent account
			await UserTradingAccount.updateOne(
				{
					userId: "user123",
					platformName: TradingPlatform.BINANCE,
				},
				{
					$set: {
						errorMessages: ["Futures trading USDT balance is less than 50 USDT"],
					},
				}
			);

			// Add enough funds to cross the 50 USDT threshold
			await repository.addFundToTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				accountType: AccountType.FUTURES,
				currency: Currency.USDT,
				amount: 45, // 10 + 45 = 55
			});

			const balance = await UserTradingAccountBalance.findOne({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				accountType: AccountType.FUTURES,
				currency: Currency.USDT,
			});
			expect(balance?.availableBalance).toBe(55);

			const account = await UserTradingAccount.findOne({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
			});
			expect(account?.errorMessages).not.toContain(
				"Futures trading USDT balance is less than 50 USDT"
			);
		});

		it("should not clear the error message if futures balance is still less than 50", async () => {
			// Set up the error message on the parent account
			await UserTradingAccount.updateOne(
				{
					userId: "user123",
					platformName: TradingPlatform.BINANCE,
				},
				{
					$set: {
						errorMessages: ["Futures trading USDT balance is less than 50 USDT"],
					},
				}
			);

			// Add funds but not enough to reach 50
			await repository.addFundToTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				accountType: AccountType.FUTURES,
				currency: Currency.USDT,
				amount: 20, // 10 + 20 = 30
			});

			const balance = await UserTradingAccountBalance.findOne({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				accountType: AccountType.FUTURES,
				currency: Currency.USDT,
			});
			expect(balance?.availableBalance).toBe(30);

			const account = await UserTradingAccount.findOne({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
			});
			expect(account?.errorMessages).toContain(
				"Futures trading USDT balance is less than 50 USDT"
			);
		});

		it("should handle non-existent balance gracefully", async () => {
			// This should not throw an error even if balance doesn't exist
			await expect(
				repository.addFundToTradingAccount({
					userId: "user123",
					platformName: TradingPlatform.BINANCE,
					accountType: AccountType.SPOT, // Different account type
					currency: Currency.BTC, // Different currency
					amount: 1,
				})
			).resolves.not.toThrow();
		});
	});

	describe("archiveTradingAccount", () => {
		beforeEach(async () => {
			const account = await new UserTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				externalAccountUserId: "external123",
				connectionStatus: AccountConnectionStatus.CONNECTED,
				category: Category.CRYPTO,
				connectionType: ConnectionType.MANUAL,
				isWithdrawalEnabled: false,
				isFuturesTradingEnabled: true,
				isSpotTradingEnabled: true,
				errorMessages: [],
			}).save();

			await new UserTradingAccountBalance({
				userId: "user123",
				tradingAccountId: account._id,
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				currency: Currency.USDT,
				accountType: AccountType.FUTURES,
				availableBalance: 100,
				lockedBalance: 10,
			}).save();

			await new UserTradingAccountBalance({
				userId: "user123",
				tradingAccountId: account._id,
				platformName: TradingPlatform.BINANCE,
				platformId: 112,
				currency: Currency.BTC,
				accountType: AccountType.SPOT,
				availableBalance: 0.5,
				lockedBalance: 0,
			}).save();
		});

		it("should archive trading account and delete all balances", async () => {
			await repository.archiveTradingAccount({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
			});

			// Check account is archived
			const account = await UserTradingAccount.findOne({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
			});
			expect(account?.connectionStatus).toBe(AccountConnectionStatus.ARCHIVED);

			// Check all balances are deleted
			const balances = await UserTradingAccountBalance.find({
				userId: "user123",
				platformName: TradingPlatform.BINANCE,
			});
			expect(balances).toHaveLength(0);
		});

		it("should handle non-existent account gracefully", async () => {
			await expect(
				repository.archiveTradingAccount({
					userId: "nonexistent-user",
					platformName: TradingPlatform.BINANCE,
				})
			).resolves.not.toThrow();
		});
	});

	describe("computeAccountSize", () => {
		it("should compute correct account size for different balance tiers", () => {
			const testCases = [
				{ availableBalance: 50, lockedBalance: 0, expected: 100 },
				{ availableBalance: 90, lockedBalance: 10, expected: 100 },
				{ availableBalance: 150, lockedBalance: 50, expected: 200 },
				{ availableBalance: 450, lockedBalance: 50, expected: 500 },
				{ availableBalance: 1000, lockedBalance: 0, expected: 1000 },
				{ availableBalance: 1200, lockedBalance: 300, expected: 1500 },
				{ availableBalance: 11800, lockedBalance: 0, expected: 12500 },
				{ availableBalance: 50000, lockedBalance: 0, expected: 50000 },
				{ availableBalance: 600000, lockedBalance: 0, expected: 500000 }, // Above highest tier
			];

			testCases.forEach(({ availableBalance, lockedBalance, expected }) => {
				const result = repository.computeAccountSize(availableBalance, lockedBalance);
				expect(result).toBe(expected);
			});
		});

		it("should handle edge cases correctly", () => {
			// Exactly on tier boundary
			const result1 = repository.computeAccountSize(100, 0);
			expect(result1).toBe(100);

			// Just above tier boundary
			const result2 = repository.computeAccountSize(101, 0);
			expect(result2).toBe(200);

			// Very small amounts
			const result3 = repository.computeAccountSize(1, 0);
			expect(result3).toBe(100);
		});
	});

	describe("performTradingAccountHealthCheck", () => {
		const baseAccountInfo: ITradingAccountInfo = {
			accountId: "test-id",
			userId: "user123",
			platformName: TradingPlatform.BINANCE,
			platformId: 112,
			platformLogo: "logo.png",
			externalAccountUserId: "external123",
			isWithdrawalEnabled: false,
			isFuturesTradingEnabled: true,
			isSpotTradingEnabled: true,
			isIpAddressWhitelisted: true,
			connectionStatus: undefined as any,
			errorMessages: [],
			category: Category.CRYPTO,
			connectionType: ConnectionType.MANUAL,
			balances: [
				{
					currency: Currency.USDT,
					accountType: AccountType.FUTURES,
					availableBalance: 100,
					lockedBalance: 0,
				},
			],
		};

		it("should pass all health checks with valid account", async () => {
			const result = (repository as any).performTradingAccountHealthCheck(
				baseAccountInfo,
				false // IP whitelist not required
			);

			expect(result).toEqual([]);
		});

		it("should not fail when withdrawal is enabled", async () => {
			const accountInfo = {
				...baseAccountInfo,
				isWithdrawalEnabled: true,
			};

			const result = (repository as any).performTradingAccountHealthCheck(accountInfo, false);

			expect(result).not.toContain("Withdrawal is enabled");
		});

		it("should fail when futures trading is not enabled", async () => {
			const accountInfo = {
				...baseAccountInfo,
				isFuturesTradingEnabled: false,
			};

			const result = (repository as any).performTradingAccountHealthCheck(accountInfo, false);

			expect(result).toContain("FUTURES trading is not enabled");
		});

		it("should fail when spot trading is not enabled", async () => {
			const accountInfo = {
				...baseAccountInfo,
				isSpotTradingEnabled: false,
			};

			const result = (repository as any).performTradingAccountHealthCheck(accountInfo, false);

			expect(result).toContain("SPOT trading is not enabled");
		});

		it("should fail when IP whitelist required but not whitelisted", async () => {
			const accountInfo = {
				...baseAccountInfo,
				isIpAddressWhitelisted: false,
			};

			const result = (repository as any).performTradingAccountHealthCheck(
				accountInfo,
				true // IP whitelist required
			);

			expect(result).toContain("TraderApp IP addresses haven't been whitelisted");
		});

		it("should pass when IP whitelist not required and not whitelisted", async () => {
			const accountInfo = {
				...baseAccountInfo,
				isIpAddressWhitelisted: false,
			};

			const result = (repository as any).performTradingAccountHealthCheck(
				accountInfo,
				false // IP whitelist not required
			);

			expect(result).not.toContain("TraderApp IP addresses haven't been whitelisted");
		});

		it("should fail when futures USDT balance is less than 50", async () => {
			const accountInfo = {
				...baseAccountInfo,
				balances: [
					{
						currency: Currency.USDT,
						accountType: AccountType.FUTURES,
						availableBalance: 25, // Less than 50
						lockedBalance: 0,
					},
				],
			};

			const result = (repository as any).performTradingAccountHealthCheck(accountInfo, false);

			expect(result).toContain("Futures trading USDT balance is less than 50 USDT");
		});

		it("should pass when futures USDT balance equals 50", async () => {
			const accountInfo = {
				...baseAccountInfo,
				balances: [
					{
						currency: Currency.USDT,
						accountType: AccountType.FUTURES,
						availableBalance: 50, // Exactly 50
						lockedBalance: 0,
					},
				],
			};

			const result = (repository as any).performTradingAccountHealthCheck(accountInfo, false);

			expect(result).not.toContain("Futures trading USDT balance is less than 50 USDT");
		});

		it("should fail when no futures USDT balance exists", async () => {
			const accountInfo = {
				...baseAccountInfo,
				balances: [
					{
						currency: Currency.BTC,
						accountType: AccountType.FUTURES,
						availableBalance: 1,
						lockedBalance: 0,
					},
				],
			};

			const result = (repository as any).performTradingAccountHealthCheck(accountInfo, false);

			expect(result).toContain("Futures trading USDT balance is less than 50 USDT");
		});

		it("should fail multiple health checks simultaneously", async () => {
			const accountInfo = {
				...baseAccountInfo,
				isWithdrawalEnabled: true,
				isFuturesTradingEnabled: false,
				isSpotTradingEnabled: false,
				isIpAddressWhitelisted: false,
				balances: [
					{
						currency: Currency.USDT,
						accountType: AccountType.FUTURES,
						availableBalance: 10,
						lockedBalance: 0,
					},
				],
			};

			const result = (repository as any).performTradingAccountHealthCheck(accountInfo, true);

			expect(result).toHaveLength(4);
			// expect(result).toContain("Withdrawal is enabled");
			expect(result).toContain("FUTURES trading is not enabled");
			expect(result).toContain("SPOT trading is not enabled");
			expect(result).toContain("TraderApp IP addresses haven't been whitelisted");
			expect(result).toContain("Futures trading USDT balance is less than 50 USDT");
		});
	});
});
