import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

/**
 * 注册新用户:校验唯一性、bcrypt 哈希密码、发放初始积分(schema 默认 1000)。
 * 邮箱或用户名重复则抛错。
 */
export async function registerUser(input: RegisterInput) {
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (username.length < 2) throw new Error("用户名至少 2 个字符");
  if (!email.includes("@")) throw new Error("邮箱格式不正确");
  if (password.length < 6) throw new Error("密码至少 6 位");

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) throw new Error("该邮箱或用户名已被注册");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { username, email, passwordHash },
    select: { id: true, username: true, email: true, pointsBalance: true },
  });
  return user;
}
