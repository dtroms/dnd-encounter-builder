# Stat Block Parser Test Cases

These cases document expected behavior for the paste stat block importer. They
are written as product/parser fixtures for future automated tests.

## Beggar Ghoul Homebrew Case

Input includes:

- `Armor Class 12 ()`
- `Hit Points 13 (3d8)`
- `Challenge 1/2 (100 XP)`
- ability table with `STR DEX CON INT WIS CHA`
- unheaded traits before `ACTIONS`
- `Damage Immunities poison`
- `Condition Immunities charmed, exhaustion, poisoned`

Expected:

- AC parses as `12`, not `NaN`.
- HP parses as `13`, with formula `3d8`.
- CR parses as string `1/2`, not `0`.
- Ability scores parse as STR 10, DEX 15, CON 10, INT 12, WIS 11, CHA 14.
- Traits include Pack Tactics and Savage Hunger.
- Actions include Bite and Claws.
- Damage immunities include poison.
- Condition immunities include charmed, exhaustion, poisoned.

## AC With Parenthetical Notes

Inputs:

- `Armor Class 16 (natural armor)`
- `Armor Class: 18 (plate, shield)`
- `AC 12`
- `AC: 12`

Expected:

- Numeric AC is preserved.
- Parenthetical text is preserved as an armor note.
- Unrecognized AC returns a missing-field warning rather than `NaN`.

## HP With Formula

Inputs:

- `Hit Points 13 (3d8)`
- `Hit Points: 105 (10d10 + 50)`
- `HP 13`
- `HP: 13`

Expected:

- Numeric HP is preserved.
- Formula text is preserved.
- Damage formulas inside actions are not mistaken for HP.

## Fractional Challenge Rating

Inputs:

- `Challenge 1/8 (25 XP)`
- `Challenge 1/4 (50 XP)`
- `Challenge 1/2 (100 XP)`
- `Challenge Rating 1/2`
- `CR: 1/2`

Expected:

- CR remains a string, such as `1/2`.
- Fractional CR is not converted to `0`.
- XP text is preserved when present.

## Ability Score Formats

Supported inputs:

- Header row: `STR DEX CON INT WIS CHA`
- Full header row: `Strength Dexterity Constitution Intelligence Wisdom Charisma`
- Inline abbreviated scores: `STR 10 (+0), DEX 15 (+2), ...`
- One ability per line: `Strength 10 (+0)`
- Full inline names: `Strength 10 (+0), Dexterity 15 (+2), ...`

Expected:

- The parser captures the six scores and ignores parenthetical modifiers.
- If no valid ability block exists, it warns that ability scores need review.

## Traits Before Actions

Input has named paragraphs before the `ACTIONS` heading and no `Traits`
heading.

Expected:

- Named paragraphs become traits.
- Spellcasting paragraphs keep following spell-level lines attached when
  practical.

## Defenses

Inputs:

- `Damage Vulnerabilities radiant`
- `Damage Resistances cold, fire; bludgeoning, piercing, and slashing from nonmagical attacks`
- `Damage Immunities poison`
- `Condition Immunities charmed, exhaustion, poisoned`

Expected:

- Values are preserved as lists or text entries.
- Complex semicolon/comma lists are not dropped.

## Spellcasting Trait

Input:

```text
Spellcasting. The mage is a 5th-level spellcaster...
Cantrips (at will): fire bolt, mage hand
1st level (4 slots): shield, magic missile
2nd level (3 slots): misty step
```

Expected:

- Spellcasting is preserved as a trait.
- Spell level lines remain attached to the Spellcasting description when
  practical.
- Deep spell structure can come later.

## Lair Action Bullet List

Input:

```text
Lair Actions
On initiative count 20...
- The ground shakes.
- Smoke appears.
```

Expected:

- Bullet lines become generated lair actions such as `Lair Action 1`.
- Descriptions are preserved.

## Legendary Actions With Intro

Input:

```text
Legendary Actions
The creature can take 3 legendary actions...
Detect. The creature makes a Wisdom check.
Tail Attack. The creature makes a tail attack.
```

Expected:

- Intro text is not treated as the first named action when possible.
- Detect and Tail Attack become legendary action entries.

## No Actions Found

Expected:

- Parser warning says no actions were detected.
- Review panel still renders and allows manual action entry.

## Missing AC / HP

Expected:

- Parser returns missing-field warnings.
- Review UI does not display `NaN`, `undefined`, `null`, or `[object Object]`.
- Save to Library remains blocked until required fields are fixed.
