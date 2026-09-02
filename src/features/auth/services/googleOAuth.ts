/**
 * Google Identity Services (GIS) Token Client for Pure SPAs (Zero-Backend).
 * Uses Google OAuth 2.0 implicit/token model via official GIS SDK.
 */

const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.appdata",
].join(" ")

export interface GoogleUser {
  sub: string
  email: string
  name: string
  picture?: string | undefined
}

export interface TokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  error?: string
  error_description?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: TokenResponse) => void
            error_callback?: (err: unknown) => void
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void
          }
        }
      }
    }
  }
}

/**
 * Loads the official Google Identity Services script if not already loaded.
 */
export function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }

    const existingScript = document.getElementById("google-gis-script")
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve())
      existingScript.addEventListener("error", (e) => reject(e))
      return
    }

    const script = document.createElement("script")
    script.id = "google-gis-script"
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = (err) => reject(err)
    document.head.appendChild(script)
  })
}

/**
 * Requests an access token using Google Identity Services token client.
 */
export async function requestGoogleAccessToken(clientId: string): Promise<string> {
  await loadGoogleIdentityScript()

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity Services script failed to initialize")
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (res: TokenResponse) => {
        if (res.error) {
          reject(new Error(res.error_description ?? res.error))
          return
        }
        resolve(res.access_token)
      },
      error_callback: (err: unknown) => {
        reject(err)
      },
    })

    client.requestAccessToken({ prompt: "select_account" })
  })
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUser> {
  const res = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile: ${res.status}`)
  }

  const data = (await res.json()) as { sub: string; email: string; name: string; picture?: string }
  return {
    sub: data.sub,
    email: data.email,
    name: data.name,
    picture: data.picture,
  }
}
