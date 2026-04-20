---
format: text-adventure-lore
version: 1
skill-version: "1.3.0" # Keep at v1.3.0

title: "The Glass Reef Atlas"
subtitle: "A Salvage-Mystery on the Shattersea Frontier"
description: >
  On the night a live atlas shard comes to auction under emergency law,
  cartographer Callis Dray vanishes. In Cinder Anchorage, a harbour welded from
  wrecks at the edge of the Shattersea, every faction wants the shard, every
  ledger lies, and every safe route may be killing someone out of sight. To go
  looking is to descend into the living Glass Reef, where memory can be edited,
  danger is only ever moved, and the future of the frontier may hinge on who is
  forced to bear the cost of safety.
author: "Gareth Williams"
theme: space
tone: mystery
acts: 1
episodes: 1
estimated-scenes: "7-9"
players: "1"
difficulty: hard
pacing: slow
edited: true
demo: true

recommended-styles:
  output: Sci-Fi-Narrator
  visual: holographic

seed: "glass-reef-atlas-31"
rulebook: d20_system

calendar-system: "Anchorage Drift Reckoning (26-hour tide cycle)"
start-date: "Cycle 403.19"
start-time: "21:00"

pre-generated-characters:
  - name: "Rian Vale"
    class: "Cartographer"
    pronouns: "he/him"
    stats: { STR: 9, DEX: 13, CON: 10, INT: 16, WIS: 14, CHA: 12 }
    hp: 10
    ac: 12
    openingLens: "rian"
    prologueVariant: "pregen_rian"
    hook: "Callis Dray trusted you with a route fragment, a warning about the quay, and a promise you reached too late."
    background: >
      You made your name charting quiet dangers for crews who could not afford
      licensed pilots. You know how to read panic in a ship log, how to tell
      when a safe route has started lying, and how long guilt can stay lodged in
      a person's hands after the wrong delay.
    proficiencies: ["Investigation", "Navigation", "Insight", "Perception"]
    starting-inventory:
      - { name: "Folded route-slate", type: "key_item", effect: "Compares live routes against known charts" }
      - { name: "Pressure hood", type: "gear", effect: "Protects against brief hull exposure" }
    starting-currency: 90
  - name: "Suri Kade"
    class: "Reef Diver"
    pronouns: "she/her"
    stats: { STR: 12, DEX: 15, CON: 13, INT: 11, WIS: 13, CHA: 10 }
    hp: 12
    ac: 13
    openingLens: "suri"
    prologueVariant: "pregen_suri"
    hook: "The Wakebound will lend you the Borrowed Tide if you bring back more than excuses from the berth that failed on your watch."
    background: >
      You grew up on improvised docks, breathing recycled air and learning that
      courage is often just labour with better stories told about it. Some of
      the outer-moorings crews still call you family. Others remember exactly
      which shift taught you to leave before the hull finished teaching harder.
    proficiencies: ["Athletics", "Stealth", "Survival", "Perception"]
    starting-inventory:
      - { name: "Wakebound dive rig", type: "gear", effect: "Lets you work exposed hulls and flooded compartments" }
      - { name: "Glass hook", type: "weapon", effect: "Tool and weapon for climbing raw reef surfaces" }
    starting-currency: 55
  - name: "Mara Ilex"
    class: "Choir Defector"
    pronouns: "they/them"
    stats: { STR: 8, DEX: 12, CON: 11, INT: 14, WIS: 15, CHA: 14 }
    hp: 9
    ac: 11
    openingLens: "mara"
    prologueVariant: "pregen_mara"
    hook: "You know one stanza of the forbidden route-song, and one patient at Salt Wound still remembers the part you played in teaching it."
    background: >
      You were taught to preserve memory as prayer. Then you learned some hymns
      were written to edit the living, not honour the dead. Someone inside the
      hospice once covered your exit. You do not know whether they bought you
      time, silence, or both.
    proficiencies: ["Insight", "Persuasion", "Medicine", "Lore"]
    starting-inventory:
      - { name: "Resonance veil", type: "gear", effect: "Helps you hear signal drift inside memory storms" }
      - { name: "Choir signet", type: "key_item", effect: "Grants narrow access to hospice and reliquary spaces" }
    starting-currency: 70

required-modules:
  - core-systems
  - bestiary
  - story-architect
  - ship-systems
  - crew-manifest
  - geo-map
  - procedural-world-gen
  - lore-codex
  - world-history
  - ai-npc
  - pre-generated-characters

optional-modules:
  - star-chart
  - atmosphere
  - audio
  - save-codex
---

<!-- LORE:ae498830.LF1:eyJfbG9yZVZlcnNpb24iOjEsIl9zY2hlbWFWZXJzaW9uIjoiMS4zLjAiLCJyb3N0ZXJNdXRhdGlvbnMiOltdLCJmYWN0aW9ucyI6e30sInF1ZXN0cyI6W10sIndvcmxkRmxhZ3MiOnsicnVsZWJvb2siOiJkMjBfc3lzdGVtIn0sImN1cnJlbnRSb29tIjoiZW1iZXJfcXVheSIsInRpbWUiOnsiaG91ciI6MjEsImRhdGUiOiJDeWNsZSA0MDMuMTkiLCJjYWxlbmRhclN5c3RlbSI6IkFuY2hvcmFnZSBEcmlmdCBSZWNrb25pbmcgKDI2LWhvdXIgdGlkZSBjeWNsZSkifSwibW9kdWxlc0FjdGl2ZSI6WyJjb3JlLXN5c3RlbXMiLCJiZXN0aWFyeSIsInN0b3J5LWFyY2hpdGVjdCIsInNoaXAtc3lzdGVtcyIsImNyZXctbWFuaWZlc3QiLCJnZW8tbWFwIiwicHJvY2VkdXJhbC13b3JsZC1nZW4iLCJsb3JlLWNvZGV4Iiwid29ybGQtaGlzdG9yeSIsImFpLW5wYyIsInByZS1nZW5lcmF0ZWQtY2hhcmFjdGVycyJdLCJzZWVkIjoiZ2xhc3MtcmVlZi1hdGxhcy0zMSIsInRoZW1lIjoic3BhY2UiLCJ2aXN1YWxTdHlsZSI6ImhvbG9ncmFwaGljIiwiY29kZXhNdXRhdGlvbnMiOltdLCJwcmV2aW91c0FkdmVudHVyZXIiOm51bGwsImF1dGhvcmVkU291cmNlSWQiOiJ0aGUtZ2xhc3MtcmVlZi1hdGxhcy1kZW1vIiwicGFjaW5nUHJvZmlsZSI6InNsb3cifQ== -->
