import UserTradingAccountBalance, {
	IUserTradingAccountBalance,
} from "../models/UserTradingAccountBalance";
import { createRepository } from "./BaseRepository";

// Use the createRepository function to instantiate the repository
const userTradingAccountBalanceRepository =
	createRepository<IUserTradingAccountBalance>(UserTradingAccountBalance);

export default userTradingAccountBalanceRepository;
