// server/src/utils/guestCards.ts
// Helpers for the per-person entry cards of a premium/VIP guest.
//
// numberOfAccompanyingGuests is the total number of people on an invitation,
// the guest included, so an invitation for 4 needs 4 cards: the guest's own
// card plus one for each of the 3 accompanying guests.
import { ICloudinaryImage, IGuest } from '../models/Event';

/** How many people this invitation covers, and therefore how many cards it needs. */
export function getInvitationSize(guest: Pick<IGuest, 'numberOfAccompanyingGuests'>): number {
  return Math.max(1, guest.numberOfAccompanyingGuests || 1);
}

/**
 * The guest's cards, oldest storage shape included: guests added before cards
 * were per-person only have the single individualInviteImage, which is the
 * guest's own card (slot 0).
 */
export function getGuestCards(guest: Partial<IGuest>): ICloudinaryImage[] {
  const cards = (guest.individualInviteImages || []).filter(Boolean) as ICloudinaryImage[];

  if (cards.length > 0) {
    return cards;
  }

  return guest.individualInviteImage ? [guest.individualInviteImage] : [];
}

/** Cards still missing before this guest's invitation can be sent. */
export function getMissingCardCount(guest: Partial<IGuest> & Pick<IGuest, 'numberOfAccompanyingGuests'>): number {
  return Math.max(0, getInvitationSize(guest) - getGuestCards(guest).length);
}

/** True when every person on the invitation has a card. */
export function hasAllCards(guest: Partial<IGuest> & Pick<IGuest, 'numberOfAccompanyingGuests'>): boolean {
  return getMissingCardCount(guest) === 0;
}

/**
 * The cards to actually send, given how many people the guest confirmed. Falls
 * back to every card on file when there are fewer than confirmed, so a guest
 * still receives what the admin did upload.
 */
export function getCardsToSend(
  guest: Partial<IGuest> & Pick<IGuest, 'numberOfAccompanyingGuests'>,
  confirmedCount?: number
): ICloudinaryImage[] {
  const cards = getGuestCards(guest);
  const wanted = Math.max(1, Math.min(confirmedCount ?? getInvitationSize(guest), getInvitationSize(guest)));

  return cards.slice(0, wanted);
}

/** Usable https URL of a card, or '' when it has none. */
export function getCardUrl(card?: ICloudinaryImage): string {
  const url = card?.secure_url || card?.url || '';

  if (!url.startsWith('http')) {
    return '';
  }

  return url.startsWith('https://') ? url : url.replace(/^http:\/\//, 'https://');
}
