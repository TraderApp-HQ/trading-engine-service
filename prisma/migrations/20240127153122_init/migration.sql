-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('SPOT', 'FUTURES', 'MARGIN');

-- CreateEnum
CREATE TYPE "SignalSide" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "Exchanges" (
    "id" INTEGER NOT NULL,
    "slug" VARCHAR(30) NOT NULL,

    CONSTRAINT "Exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currencies" (
    "id" INTEGER NOT NULL,
    "slug" VARCHAR(30) NOT NULL,
    "symbol" VARCHAR(30) NOT NULL,

    CONSTRAINT "Currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeAccounts" (
    "id" SERIAL NOT NULL,
    "keys" TEXT NOT NULL,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "maxOrderAllowed" INTEGER NOT NULL DEFAULT 50000,
    "exchangeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeAccountBalances" (
    "exchangeAccountId" INTEGER NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "balanceLocked" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ExchangeAccountBalances_pkey" PRIMARY KEY ("exchangeAccountId","currencyId")
);

-- CreateTable
CREATE TABLE "Signals" (
    "id" VARCHAR(255) NOT NULL,
    "symbol" VARCHAR(30) NOT NULL,
    "type" "SignalType" NOT NULL,
    "side" "SignalSide" NOT NULL,
    "leverage" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entries" (
    "signalId" VARCHAR(255) NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "priceLowerBound" DECIMAL(65,30) NOT NULL,
    "priceUpperBound" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Entries_pkey" PRIMARY KEY ("signalId","currencyId")
);

-- CreateTable
CREATE TABLE "StopLoss" (
    "signalId" VARCHAR(255) NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "isReached" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StopLoss_pkey" PRIMARY KEY ("signalId","currencyId")
);

-- CreateTable
CREATE TABLE "SignalTargets" (
    "signalId" VARCHAR(255) NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "isReached" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SignalTargets_pkey" PRIMARY KEY ("signalId","currencyId")
);

-- CreateTable
CREATE TABLE "SignalPairsData" (
    "exchangeId" INTEGER NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "signalId" VARCHAR(255) NOT NULL,
    "pair" VARCHAR(30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "buyQuantityInRange" DECIMAL(65,30) NOT NULL,
    "sellQuantityInRange" DECIMAL(65,30) NOT NULL,
    "maxOrderAmount" DECIMAL(65,30) NOT NULL,
    "maxOrderAmountLeft" DECIMAL(65,30) NOT NULL,
    "canEnterTrade" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SignalPairsData_pkey" PRIMARY KEY ("exchangeId","currencyId","signalId")
);

-- CreateTable
CREATE TABLE "OrderBatches" (
    "id" VARCHAR(255) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "type" "OrderType" NOT NULL,
    "baseQuantity" DECIMAL(65,30) NOT NULL,
    "quoteTotal" DECIMAL(65,30) NOT NULL,
    "isPlaced" BOOLEAN NOT NULL DEFAULT false,
    "isInserted" BOOLEAN NOT NULL DEFAULT false,
    "exchangeOrderId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exchangeAccountId" INTEGER NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "signalId" VARCHAR(255) NOT NULL,

    CONSTRAINT "OrderBatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trades" (
    "id" VARCHAR(255) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "baseQuantity" DECIMAL(65,30) NOT NULL,
    "baseQuantityLeft" DECIMAL(65,30) NOT NULL,
    "quoteTotal" DECIMAL(65,30) NOT NULL,
    "signalId" VARCHAR(255) NOT NULL,

    CONSTRAINT "Trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" VARCHAR(255) NOT NULL,
    "baseQuantity" DECIMAL(65,30) NOT NULL,
    "quoteTotal" DECIMAL(65,30) NOT NULL,
    "batchId" VARCHAR(255) NOT NULL,
    "tradeId" VARCHAR(255) NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Currencies_symbol_idx" ON "Currencies"("symbol");

-- CreateIndex
CREATE INDEX "ExchangeAccountBalances_balance_idx" ON "ExchangeAccountBalances"("balance");

-- CreateIndex
CREATE UNIQUE INDEX "Signals_symbol_key" ON "Signals"("symbol");

-- CreateIndex
CREATE INDEX "SignalTargets_isReached_price_idx" ON "SignalTargets"("isReached", "price");

-- CreateIndex
CREATE INDEX "SignalPairsData_canEnterTrade_pair_idx" ON "SignalPairsData"("canEnterTrade", "pair");

-- CreateIndex
CREATE INDEX "OrderBatches_isPlaced_isInserted_idx" ON "OrderBatches"("isPlaced", "isInserted");

-- CreateIndex
CREATE INDEX "Trades_isCompleted_idx" ON "Trades"("isCompleted");

-- AddForeignKey
ALTER TABLE "ExchangeAccounts" ADD CONSTRAINT "ExchangeAccounts_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchanges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeAccountBalances" ADD CONSTRAINT "ExchangeAccountBalances_exchangeAccountId_fkey" FOREIGN KEY ("exchangeAccountId") REFERENCES "ExchangeAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeAccountBalances" ADD CONSTRAINT "ExchangeAccountBalances_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entries" ADD CONSTRAINT "Entries_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entries" ADD CONSTRAINT "Entries_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StopLoss" ADD CONSTRAINT "StopLoss_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StopLoss" ADD CONSTRAINT "StopLoss_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalTargets" ADD CONSTRAINT "SignalTargets_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalTargets" ADD CONSTRAINT "SignalTargets_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalPairsData" ADD CONSTRAINT "SignalPairsData_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchanges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalPairsData" ADD CONSTRAINT "SignalPairsData_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalPairsData" ADD CONSTRAINT "SignalPairsData_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBatches" ADD CONSTRAINT "OrderBatches_exchangeAccountId_fkey" FOREIGN KEY ("exchangeAccountId") REFERENCES "ExchangeAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBatches" ADD CONSTRAINT "OrderBatches_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBatches" ADD CONSTRAINT "OrderBatches_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trades" ADD CONSTRAINT "Trades_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "OrderBatches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
