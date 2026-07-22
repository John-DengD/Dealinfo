"use server";

import { AuthError } from "next-auth";
import { registerUser } from "@/server/accounts";
import { signIn } from "@/lib/auth";

export type AuthActionState = { error?: string };

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const username = String(formData.get("username") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await registerUser({ username, email, password });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "注册失败" };
  }
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return {};
  } catch (e) {
    if (e instanceof AuthError) return { error: "注册成功但自动登录失败,请手动登录" };
    throw e;
  }
}
