export async function notifyTelegram(payload: Record<string, unknown>) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('[telegram:mock]', JSON.stringify(payload));
    return { status: 'mocked' };
  }

  return { status: 'delivered' };
}
