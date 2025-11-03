import { binanceFuturesPairCandlesJob } from "./BinanceFuturesPairCandlesJob";
import { bybitFuturesPairCandlesJob } from "./BybitFuturesPairCandlesJob";

const runAllJobs = () => {
	binanceFuturesPairCandlesJob();
	bybitFuturesPairCandlesJob();
};

export default runAllJobs;
