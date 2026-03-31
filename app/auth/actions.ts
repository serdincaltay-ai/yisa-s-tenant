"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: kullanici } = await supabase
      .from("kullanicilar")
      .select("rol_id, roller(kod)")
      .eq("auth_id", user.id)
      .single()

    const roller = kullanici?.roller
    const kod = Array.isArray(roller)
      ? roller[0]?.kod
      : roller != null && typeof roller === "object" && "kod" in roller
        ? (roller as { kod: string }).kod
        : undefined
    const rol = kod ?? "veli"

    switch (rol) {
      case "patron":
        redirect("/patron")
      case "tesis_sahibi":
        redirect("/tesis")
      case "antrenor":
        redirect("/antrenor")
      default:
        redirect("/veli")
    }
  }

  redirect("/")
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const ad_soyad = formData.get("ad_soyad") as string

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { ad_soyad },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: "Kayit basarili! Email onayinizi bekliyor." }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
