"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type AuthActionState = { error?: string };

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return {};
  } catch (e) {
    if (e instanceof AuthError) return { error: "邮箱或密码错误" };
    throw e; // 让 NEXT_REDIRECT 正常抛出
  }
}
