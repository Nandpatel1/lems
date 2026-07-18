/** Build a free wa.me link that opens WhatsApp with a prefilled message.
 *  The sender picks the chat/group and taps send — no cost, no API. */
export function waMeUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
