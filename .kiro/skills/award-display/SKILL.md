---
name: award-display
description: Use for curated award content and authenticated presentation mode.
---

- Contract is version 1 in `events.award_json`; items contain stable id, name, optional participantId, recipientName, subtitle, image, and displayOrder.
- Participant selection is validated against the current event. `participantId: null` supports external recipients.
- Admin and Event Manager manage, delete, and reorder awards through the recognition studio cards; Receptionist can view but cannot edit.
- Display routes show only award name, recipient, subtitle, and image/banner; no contact data or admin controls are exposed.
- Tests cover save/reload, ordering, participant isolation, external recipients, and display data privacy.
- Display uses the presentation route group, not dashboard navigation, and provides fullscreen/return controls.
- Award edit opens in a spacious modal with sticky save; reorder controls show award titles and disable moves at the bounds. Mutations record activity and use application-modal confirmations for deletion.
