// Google OAuth token refresh — called when access token expires (1 hour TTL)

interface TokenResponse {
  access_token:  string
  expires_in:    number
  token_type:    string
}

export async function refreshGoogleToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })

  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`)

  return res.json()
}
