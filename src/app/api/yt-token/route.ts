import { NextResponse } from 'next/server';

export async function GET() {
  const client_id = process.env.YT_CLIENT_ID;
  const client_secret = process.env.YT_CLIENT_SECRET;
  const refresh_token = process.env.YT_REFRESH_TOKEN;

  if (!client_id || !client_secret || !refresh_token) {
    return NextResponse.json(
      { error: 'YouTube API environment variables (YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN) are missing.' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id,
        client_secret,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error_description || 'Failed to refresh YouTube access token' },
        { status: response.status }
      );
    }

    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error('YouTube Token API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
