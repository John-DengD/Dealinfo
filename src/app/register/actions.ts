"use server";

import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { registerUser } from "@/server/accounts";
import { signIn } from "@/lib/auth";
import { cv, tracker, visitorIdFromCookie } from "@/lib/tracker";

export type AuthActionState = { error?: string };

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const username = String(formData.get("username") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const user = await registerUser({ username, email, password });
    await tracker.trackImmediate(cv.registrationComplete, {
      distinctId: user.id,
      visitorId: await visitorIdFromCookie(await cookies()),
      identity: { email: user.email },
      metadata: { signup_method: "credentials" },
    });
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
