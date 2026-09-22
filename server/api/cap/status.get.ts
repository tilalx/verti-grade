import { eventHandler } from 'h3'
import { capSecret } from '../../utils/cap'

/**
 * Whether the captcha is switched on, so a form knows to solve a challenge
 * before submitting. Mirrors /api/mail-status: a single boolean, no credential.
 *
 * Nothing depends on the client telling the truth here -- PocketBase enforces
 * the token on its own (pb_hooks/cap.pb.js). This only spares an install that
 * runs without CAP_SECRET a pointless round trip on every submit.
 */
export default eventHandler(() => ({ enabled: !!capSecret() }))
