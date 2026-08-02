# Relationship Model

Relationships are stored separately from collection entries.

Supported types are:

- Chronicle → person
- Chronicle → place
- Chronicle → event
- event → timeline
- artifact → Chronicle
- artifact → event
- media → entry

Every relationship has a stable ID, typed endpoints, and basis `authored`.
Both endpoints must resolve to approved public entries. Broken or private
targets fail validation.

The current relationship array is empty. This is intentional: Part 1 prose
mentions people and places, but the Writing repository does not yet provide
approved independent entries for those collections. Neither plain mentions nor
the interpretive map manufacture public relationships.
