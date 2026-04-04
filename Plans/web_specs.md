# Web Specs for WorldBuilder
## Vision

WorldBuilder is a D&D worldbuilding tool designed to help Dungeon Masters and players collaboratively create, manage, and explore rich fantasy worlds. It combines structured data management with AI-assisted content generation to reduce prep time and increase creative output.

---

## Goals

1. **Reduce DM prep burden** — Automate routine worldbuilding tasks (NPC generation, location descriptions, encounter seeds) so DMs can focus on narrative.
2. **Maintain lore consistency** — Track world facts, relationships, and history in a structured way that prevents contradictions across sessions.
3. **Support collaborative play** — Allow players and DMs to contribute to world-building with appropriate permission levels.
4. **Genre authenticity** — Produce content that respects D&D conventions (RAW, RAI, and homebrew-aware) without forcing a single canon.

---

## Target Users

- **Primary:** Dungeon Masters running homebrew campaigns
- **Secondary:** Players who contribute worldbuilding content
- **Tertiary:** Writers and world-builders outside of D&D who want structured creative tooling

---

## UI experience

The UI should be clean, but feel like a D&D worldbuilding tool. It should be easy to navigate and use, but also feel immersive and inspiring. It should use a dark theme with a parchment-like background. It should use a sans-serif font for the body text and a serif font for the headings. It should use a color palette of dark grays, browns, dark reds, and golds.

## Layout

On reaching the site, the user should be taken to a landing page where they can select a world to work on or create a new world.  The general layout for site after selecting a world should follow the principle of layered disclosure where as you explore deeper into a location you get more granular information. The main scope of the site is to go from world level, to country level, to city level, to point of interest level, to npc level. When accessing a world you can see the countries in it, when you select a country you can see the cities, etc. There should be an easy to access back button in the top left of the view window to go back a layer. In each section we will need some fields for information (Such as a description, the population, the climate, etc). The information from each layer (World, country, city, POI) will need to be passed down to lower layers in it's tree such that individual NPCs can know the info about their current POI, city, country, and world. These description fields should be editable but only after a change to an "edit" mode to avoid accidental changes. 

## Data Persistance
The backend team will manage how the data gets stored, but for testing purpose we will use a local json file to store the data. Because this may change at later stages of development to something like a database or cloud storage, the data layer should be abstracted away from the UI layer. You may implement the local json file as a mock database for now.