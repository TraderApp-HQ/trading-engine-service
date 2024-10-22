import UserTradingAccount, { IUserTradingAccount } from "../models/UserTradingAccount";
import { createRepository } from "./BaseRepository"; // Use named import for createRepository

// Use the createRepository function to instantiate the repository
const userTradingAccountRepository = createRepository<IUserTradingAccount>(UserTradingAccount);

export default userTradingAccountRepository;
