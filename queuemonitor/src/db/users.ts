import { RoutingStatus, User, UserStatus } from "../models/datamodels";
import { TedisPool } from "tedis";

const pool = new TedisPool({
  port: 6379,
  host: "redis",
  min_conn: 50,
  max_conn: 200
});

export class UserDB {

  public async getUser(userId: string): Promise<User> {
    const tedis = await pool.getTedis()

    const key = userId.includes('user-') ? userId : `user-${userId}`
    const results = await tedis.get(key)
    pool.putTedis(tedis)

    if (results === null) { return null }
    const userJSON = JSON.parse(results as string)
    userJSON.queues = new Set(userJSON.queues);
    return userJSON as User
  }

  public async setUser(user: User): Promise<void> {
    const tedis = await pool.getTedis()
    const key = `user-${user.id}`
    await tedis.set(key, JSON.stringify(user, (key, value) => value instanceof Set ? [...value] : value));
    return pool.putTedis(tedis)
  }

  public async getUserStatus(userId: string) {
    const tedis = await pool.getTedis()

    const key = userId.includes('userstatus-') ? userId : `userstatus-${userId}`
    const results = await tedis.get(key)
    pool.putTedis(tedis)
    return results === null ? null : JSON.parse(results as string) as UserStatus
  }

  public async setUserStatus(userStatus: UserStatus) {
    const tedis = await pool.getTedis()
    const key = `userstatus-${userStatus.routingStatus.userId}`
    await tedis.set(key, JSON.stringify(userStatus));
    return pool.putTedis(tedis)
  }


  public async getAllUserIds() {
    const tedis = await pool.getTedis();
    const keyPattern = `user-*`;

    const keys = await tedis.keys(keyPattern);
    const users = keys.map((userKey: string) => { return userKey.replace("user-", ""); });
    pool.putTedis(tedis);
    return users;
  }
}