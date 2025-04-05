# Getting data logic is being re-written

## Things to do:

- [ ] Update logic to get [user stats](src/utils/getData.js) ([old data grabber](src/utils/checkSheets.js))
  - [x] Compare mod data
  - [x] Compare player changes
  - [x] Shoutout players with changes
  - [ ] Update players
  <!-- - [ ] Make sure user stat logic only updates user if a change to the sheets or user clears (on that sheet) aren't the same -->
- [ ] Update [shoutout](src/utils/shoutouts.js) logic to update all users if a change to the sheets (a map change/another side)

## Optional:

- [ ] Get colors for tiers and add to [user stats command](src/commands/user.js) display
- [ ] Add option for user to go to website and connect discord account
- [ ] Change the link to download mods

# Database folder

The database folder includes the logic used to get sheet and gb data and parse it into an sql file that can then uploaded into the [website's](https://celeste-skill-rating.great-site.net/) db

> [!NOTE]
> The website currently works but is not very functional as it's in progress and not up to date as the discord bot is being focused on at the moment
