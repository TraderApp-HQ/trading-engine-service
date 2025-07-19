export const paymentProviders = [
	{
		name: "CryptoPay",
	},
];

export const paymentCatgories = [
	{
		name: "Crypto",
	},
];

export const paymentMethods = [
	{
		name: "Bitcoin",
		currency: "BTC",
		networks: [
			{
				network: "bitcoin",
				name: "Bitcoin",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/BTC.svg",
	},
	{
		name: "Litecoin",
		currency: "LTC",
		networks: [
			{
				network: "litecoin",
				name: "Litecoin",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/LTC.svg",
	},
	{
		name: "Bitcoin Cash",
		currency: "BCH",
		networks: [
			{
				network: "bitcoin_cash",
				name: "Bitcoin Cash",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/BCH.svg",
	},
	{
		name: "XRP",
		currency: "XRP",
		networks: [
			{
				network: "ripple",
				name: "Ripple",
				precision: 6,
				destination_tag: { required: true, name: "Destination tag" },
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/XRP.svg",
	},
	{
		name: "Ethereum",
		currency: "ETH",
		networks: [
			{
				network: "ethereum",
				name: "Ethereum (ERC20)",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/ETH.svg",
	},
	{
		name: "Tether",
		currency: "USDT",
		networks: [
			{
				network: "ethereum",
				name: "Ethereum (ERC20)",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "tron",
				name: "Tron (TRC20)",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "solana",
				name: "Solana",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/USDT.svg",
	},
	{
		name: "Dai",
		currency: "DAI",
		networks: [
			{
				network: "ethereum",
				name: "Ethereum (ERC20)",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/DAI.svg",
	},
	{
		name: "USD Coin",
		currency: "USDC",
		networks: [
			{
				network: "ethereum",
				name: "Ethereum (ERC20)",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "solana",
				name: "Solana",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/USDC.svg",
	},
	{
		name: "Cardano",
		currency: "ADA",
		networks: [
			{
				network: "cardano",
				name: "Cardano",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/ADA.svg",
	},
	{
		name: "BNB",
		currency: "BNB",
		networks: [
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/BNB.svg",
	},
	{
		name: "TRON",
		currency: "TRX",
		networks: [
			{
				network: "tron",
				name: "Tron (TRC20)",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 6,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/TRX.svg",
	},
	{
		name: "Dogecoin",
		currency: "DOGE",
		networks: [
			{
				network: "dogecoin",
				name: "Dogecoin",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 8,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/DOGE.svg",
	},
	{
		name: "Solana",
		currency: "SOL",
		networks: [
			{
				network: "solana",
				name: "Solana",
				precision: 9,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
			{
				network: "bnb_smart_chain",
				name: "BNB Smart Chain (BEP20)",
				precision: 9,
				destination_tag: null,
				invoices: {
					enabled: true,
				},
				channels: {
					enabled: true,
				},
				coin_withdrawals: {
					enabled: true,
				},
			},
		],
		logo: "https://sandbox-cs-ledger.s3.eu-west-1.amazonaws.com/public/currencies/SOL.svg",
	},
];
