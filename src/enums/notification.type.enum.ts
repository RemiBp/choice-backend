export enum NotificationTypeEnums {
  BOOKING_CREATED = 'bookingCreated',
  BOOKING_STARTED = 'bookingStarted',
  BOOKING_CUSTOMER_CANCELLED = 'bookingCustomerCancelled',
  BOOKING_RESTAURANT_CANCELLED = 'bookingRestaurantCancelled',
  BOOKING_COMPLETED = 'bookingCompleted',
  BOOKING_ADD_REVIEW = 'bookingAddReview',
  BOOKING_START_REMINDER = 'bookingStartReminder',
  BOOKING_CUSTOMER_CHECKIN = 'bookingCustomerCheckin',
  BOOKING_UPDATED = 'bookingUpdated',
  CHAT_MESSAGE = 'chatMessage',
  OFFER = "OFFER",

  // Interest Flow
  INTEREST_INVITE = 'interestInvite',
  INTEREST_ACCEPTED = 'interestAccepted',
  INTEREST_DECLINED = 'interestDeclined',
  INTEREST_SUGGESTED_NEW_TIME = 'interestSuggestedNewTime',
  INTEREST_SLOT_UPDATED = 'interestSlotUpdated',
  INTEREST_CONFIRMED = 'interestConfirmed',
}
