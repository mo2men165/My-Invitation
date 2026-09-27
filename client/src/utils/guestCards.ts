// client/src/utils/guestCards.ts
// Entry cards of a premium/VIP guest, mirroring server/src/utils/guestCards.ts.
//
// numberOfAccompanyingGuests is the total number of people an invitation covers,
// the guest included, so that many cards are needed: index 0 is the guest's own
// card and the rest belong to the accompanying guests.
interface CardLike {
  secure_url?: string;
  url?: string;
}

interface GuestLike {
  numberOfAccompanyingGuests: number;
  individualInviteImage?: CardLike;
  individualInviteImages?: CardLike[];
}

export function getInvitationSize(guest: GuestLike): number {
  return Math.max(1, guest.numberOfAccompanyingGuests || 1);
}

export function getGuestCards(guest: GuestLike): CardLike[] {
  const cards = (guest.individualInviteImages || []).filter(
    card => !!(card?.secure_url || card?.url)
  );

  if (cards.length > 0) {
    return cards;
  }

  return guest.individualInviteImage ? [guest.individualInviteImage] : [];
}

export function getMissingCardCount(guest: GuestLike): number {
  return Math.max(0, getInvitationSize(guest) - getGuestCards(guest).length);
}

export function hasAllCards(guest: GuestLike): boolean {
  return getMissingCardCount(guest) === 0;
}
