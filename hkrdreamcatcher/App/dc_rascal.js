//TODOS:
// 2. White pieces?  What is this?
// Double abilities do not work; kill them off.

// ===============================
// WEBSOCKET SERVER AND PAGE INIT 
// ===============================

function wsConnect() {
  ws = new WebSocket("ws://localhost:10051/data")
  ws.onmessage = m => { handleMessage(m.data); }
  ws.onerror = e => { console.log("[ERROR] Cannot connect to websocket.  Is Hollow Knight running?"); };
  ws.onclose = () => { setTimeout(() => { wsConnect(); }, 1000) };
}

$(window).on('load', function () {
  console.log("[OK] Connecting to websocket...")
  wsConnect();
})


// ================
// MESSAGE HANDLING
// ================

function handleMessage(m) {
  // Handles incoming messages depending on the first key sent.
  try {
    var event = JSON.parse(m)

    var eventKey = event["event_key"]
    var eventType = event["event_type"]
    var eventVal = event["event_value"]
    var eventCurrentArea = event["event_location"]

    switch (eventKey) {
      case "websocket":
        switch (eventVal) {
          case "open":
            console.log("[OK] Websocket connected.")
            console.log("[OK] Loading spoilers...")
            ws.send("/get-spoiler-log")

            intervalTasks = window.setInterval(() => {
              try {
                ws.send("/ping-dreamers")
                ws.send("/refresh-dc-log")
              } catch (DOMException) {
                clearInterval(intervalTasks)
              }
            }, 10000)
            break; // websocket_status > open

          case "closed":
            clearInterval(intervalGetScene)
            clearInterval(intervalPingDreamers)
            clearInterval(intervalRefreshItems)
            break; // websocket_status > closed
        }
        break;  // websocket_status

      case "game_level_event":
        switch (eventVal) {
          case "new_game":
            console.log("[OK] New Game Detected...")
            console.log("[OK] Removing old DreamCatcher Log...")
            ws.send("/recreate-dc-log")
            console.log("[OK] Loading spoilers...")
            ws.send("/get-spoiler-log")
            break; // game_level_event > new_game

          case "load_game":
            console.log("[OK] Loading spoilers...")
            ws.send("/get-spoiler-log")
            break; // game_level_event > load_game
        }
        break; // game_level_event

      case "ping_event":
        switch (eventType) {
          case "spoiler":
            window.spoilers = JSON.parse(eventVal)
            window.currentItems = {}
            cleanSpoiler()
            obtainNewItems()
            break; // ping_event > spoiler

          case "found_items":
            const foundItemArray = JSON.parse(eventVal)
            for (var idx = 0; idx < foundItemArray.length; idx++) {
              // Don't send an "add-to-log".
              dimItemFound(foundItemArray[idx]['item'], foundItemArray[idx]['event_location'])
            }
            break; // ping_event > found-items

          case "dreamer":
            // BUG: Pingdreamers will add an additional entry to your list if you restart the game.
            // It pings, knows you have the dreamer, but puts the new area in.
            ws.send(`/add-to-dc-log {"item": "${eventVal}", "event_location": "${eventCurrentArea}"}`)
            dimItemFound(eventVal, eventCurrentArea)
            break; // ping_event > dreamer
        }
        break; // ping_event

      case "item":
        if (eventVal && eventsToTrack.includes(eventType) && eventCurrentArea !== '') {
          ws.send(`/add-to-dc-log {"item": "${eventType}", "event_location": "${eventCurrentArea}"}`)
          dimItemFound(eventType, eventCurrentArea)
        }
        break; // item

      case "scene_transition":
        console.log("scene_transition", eventVal)
        break;

      case "exception":
        console.log("Exception", eventVal);
        break;
    }
  } catch (e) {
    console.log("[ERROR] Didn't parse:", m, e)
  }
}

// ===============
// HTML FUNCTIONS
// ===============

function makeDivCSS(area) {
  try {
    var divStyle = `background: ${locData[area]['background']}; 
        border: 6px solid ${locData[area]['border']};`
    var circleStyle = `background: ${locData[area]['border']}; 
        border: 2px solid ${locData[area]['border']};`
    return [divStyle, circleStyle]
  } catch (e) {
    console.log(e)
  }
}


function cleanSpoiler() {
  window.cleanEntries = Object.entries(window.spoilers)
    .map(x => { return [x[0], x[1].filter(s => itemsToTrack.includes(s))] }) // filters out undesirable items.
    .filter(x => x[1].length > 0); // filters empty areas 
}

function obtainNewItems() {
  // Refactor original to do a "show/hide/blur/unblur thing maybe, instead of classes."
  for (var idx = 0; idx < 2; idx++) {
    if (window.cleanEntries.length === 0) { return; }
    var _nRandomArea = Math.floor(Math.random() * window.cleanEntries.length)
    var randomPair = window.cleanEntries[_nRandomArea]
    var randomArea = randomPair[0]
    var randomItems = randomPair[1]

    var _nRandomItem = Math.floor(Math.random() * randomItems.length)
    var randomItem = randomItems[_nRandomItem]

    if (randomArea in window.currentItems) {
      window.currentItems[randomArea].push(randomItem)
    } else {
      window.currentItems[randomArea] = [randomItem]
    }

    window.cleanEntries[_nRandomArea][1].splice(_nRandomItem, 1)
    window.cleanEntries = window.cleanEntries.filter(x => x[1].length !== 0);
  }

  plotItemsOnPage(window.currentItems)
}

function plotItemsOnPage(areaItems) {
  $("#tracker-table").empty()

  var html_ = ""
  const areas = Object.keys(areaItems)
  for (var idx = 0; idx < areas.length; idx++) {
    const thisAreaItems = areaItems[areas[idx]]

    // All the image tags for the tracker.
    const [divStyle, circleStyle] = makeDivCSS(areas[idx])
    var trackerImages_ = ""
    for (var jdx = 0; jdx < thisAreaItems.length; jdx++) {
      var _event = itemToBaseEvent[thisAreaItems[jdx]];
      if (eventsToTrack.includes(_event)) {
        trackerImages_ += `
        <div class="tracker-image">
          <img class="item-image ${_event}_${locData[areas[idx]]["display"]}" src="./images/${eventToBaseItem[_event]}.png"/>
        </div>`
      }
    }

    if (trackerImages_ !== "") {
      html_ += `
    <div class="area-pill">
      <div class="area-pill-inner" style="${divStyle}">
        <div class="area-pill-rounded-edge" style="${circleStyle}">
          <div class="area-pill-area-title-div">
            <span class="area-pill-area-title-text">${locData[areas[idx]]["abbr"]}</span>
          </div>
        </div>
        <div class="pill-items-container">
          ${trackerImages_}
        </div>
      </div>
    </div>`
    }
  }
  $("#tracker-table").append(html_)
}

function dimItemFound(itemEvent, locWithUnderscores) {
  // Due to the 10 second lag and the uniqueness of the dreamers, we should just look for their name.

  var _loc = ["Monomon", "Lurien", "Herrah"].includes(itemEvent) ? "" : `_${locWithUnderscores}`
  const selector = $(`img[class*="${itemEvent}${_loc}"]:not(.item-found)`)
  console.log('got here', selector, selector.length)
  if (typeof selector !== 'undefined' && selector.length > 0) {
    console.log("Okay, dimming:", itemEvent, locWithUnderscores)
    selector.first().addClass("item-found")
    obtainNewItems()
  }
}

// =========
// CONSTANTS
// =========
const locData = {
  'Abyss': { background: "#707170", border: "#242524", abbr: "Abyss", display: 'Abyss' },
  'Ancient Basin': { background: "#73747d", border: "#282a37", abbr: "AnBsn", display: 'Ancient_Basin' },
  'City of Tears': { background: "#6b89a9", border: "#1b4a7b", abbr: "CityT", display: 'City_of_Tears' },
  'Crystal Peak': { background: "#b588b0", border: "#95568f", abbr: "CryPk", display: 'Crystal_Peak' },
  'Deepnest': { background: "#666b80", border: "#141c3c", abbr: "DNest", display: 'Deepnest' },
  'Dirtmouth': { background: "#787994", border: "#2f315b", abbr: "Dirtm", display: 'Dirtmouth' },
  'Fog Canyon': { background: "#9da3bd", border: "#5b6591", abbr: "FogCn", display: 'Fog_Canyon' },
  'Forgotten Crossroads': {
    background: "#687796", border: "#202d5d", abbr: "XRoad", display: 'Forgotten_Crossroads'
  },
  'Fungal Wastes': { background: "#58747c", border: "#113945", abbr: "FungW", display: 'Fungal_Wastes' },
  'Greenpath': { background: "#679487", border: "#155b47", abbr: "GPath", display: 'Greenpath' },
  'Hive': { background: "#C17F6E", border: "#A64830", abbr: "Hive", display: 'Hive' },
  'Howling Cliffs': { background: "#75809a", border: "#3b4a6f", abbr: "HClif", display: 'Howling_Cliffs' },
  'Kingdom\'s Edge': { background: "#768384", border: "#3c4e50", abbr: "KEdge", display: 'Kingdoms_Edge' },
  'Queen\'s Gardens': { background: "#559f9d", border: "#0d7673", abbr: "QGdn", display: 'Queens_Gardens' },
  'Resting Grounds': { background: "#84799d", border: "#423169", abbr: "RestG", display: 'Resting_Grounds' },
  'Royal Waterways': { background: "#6d919d", border: "#1e5669", abbr: "RWatr", display: 'Royal_Waterways' },
}


// Collector's map?  
// This goes to the base item.

// Ore, Simplekeys is weird.  Ore has a += 1 sort of thing going on when you collect it, so it has to be treated differently.
eventToBaseItem = {
  'scene': '',
  'Herrah': 'Herrah',
  'Monomon': 'Monomon',
  'Lurien': 'Lurien',
  'dreamNailUpgraded': "Dream_Nail",
  'gotCharm_19': 'Shaman_Stone',
  'gotCharm_20': 'Soul_Catcher',
  'gotCharm_31': 'Dashmaster',
  'hasAbyssShriek': "Howling_Wraiths",
  'hasAcidArmour': "Ismas_Tear",
  'hasCityKey': "City_Crest",
  'hasCyclone': "Cyclone_Slash",
  'hasDash': "Mothwing_Cloak",
  'hasDashSlash': "Great_Slash", // [sic]
  'hasDescendingDark': "Desolate_Dive",
  'hasDesolateDive': "Desolate_Dive",
  'hasDoubleJump': "Monarch_Wings",
  'hasDreamGate': "Dream_Nail",
  'hasDreamNail': "Dream_Nail",
  'hasHowlingWraiths': "Howling_Wraiths",
  'hasKingsBrand': "Kings_Brand",
  'hasLantern': "Lumafly_Lantern",
  'hasLoveKey': "Love_Key",
  'hasPinGrub': "Grub",
  'hasShadeSoul': "Vengeful_Spirit",
  'hasShadowDash': "Mothwing_Cloak",
  'hasSlykey': "Shopkeeper_Key",
  'hasSuperDash': "Crystal_Heart",
  'hasTramPass': "Tram_Pass",
  'hasUpwardSlash': "Dash_Slash",
  'hasVengefulSpirit': "Vengeful_Spirit",
  'hasWalljump': "Mantis_Claw",
  'hasWhiteKey': "Elegant_Key",
  'ore': "Ore",
  'simpleKeys': "Simple_Key",
  // 'gotCharm_25': 'Unbreakable_Strength',
}

//Here we make it so that the tracker shows the base version of the spell.
// This parses the spoiler.
itemToBaseEvent = {
  "Abyss Shriek": "hasHowlingWraiths",
  "Awoken Dream Nail": "hasDreamNail",
  // "City Crest": "City_Crest",
  "Collector's Map": "hasPinGrub",
  "Crystal Heart": "hasSuperDash",
  "Cyclone Slash": "hasCyclone",
  "Dash Slash": "hasUpwardSlash",
  "Descending Dark": "hasDesolateDive",
  "Desolate Dive": "hasDesolateDive",
  "Dream Gate": "hasDreamNail",
  "Dream Nail": "hasDreamNail",
  "Elegant Key": "hasWhiteKey",
  "Great Slash": "hasDashSlash",  // [sic]
  // "Grimmchild": "Grimmchild",
  "Herrah": "Herrah",
  "Howling Wraiths": "hasHowlingWraiths",
  "Isma's Tear": "hasAcidArmour",
  // "King Fragment": "Charm_KingSoul_Left",
  "King's Brand": "hasKingsBrand",
  "Love Key": "hasLoveKey",
  "Lumafly Lantern": "hasLantern",
  "Lurien": "Lurien",
  "Mantis Claw": "hasWalljump",
  "Monarch Wings": "hasDoubleJump",
  "Monomon": "Monomon",
  "Mothwing Cloak": "hasDash",
  "Pale Ore-Basin": "Pale_Ore",
  "Pale Ore-Colosseum": "Pale_Ore",
  "Pale Ore-Crystal Peak": "Pale_Ore",
  "Pale Ore-Grubs": "Pale_Ore",
  "Pale Ore-Nosk": "Pale_Ore",
  "Pale Ore-Seer": "Pale_Ore",
  // "Queen Fragment": "Charm_KingSoul_Right",
  "Shade Cloak": "hasDash",
  "Shade Soul": "hasVengefulSpirit",
  // "Shopkeeper's Key": "hasSlykey",
  // // "Simple Key-Basin": "Simple_Key",
  // // "Simple Key-City": "Simple_Key",
  // // "Simple Key-Lurker": "Simple_Key",
  // // "Simple Key-Sly": "Simple_Key",
  "Tram Pass": "hasTramPass",
  "Vengeful Spirit": "hasVengefulSpirit",
  // "Void Heart": "Void_Heart",
  // 'Unbreakable Strength': 'gotCharm_25',
  'Shaman Stone': 'gotCharm_19',
  'Soul Catcher': 'gotCharm_20',
  'Dashmaster': 'gotCharm_31',
}

itemsToTrack = [
  "Herrah",
  "Lurien",
  "Monomon",
  "Collector's Map",
  "Abyss Shriek",
  "Awoken Dream Nail",
  "Crystal Heart",
  "Descending Dark",
  "Desolate Dive",
  "Dream Gate",
  "Dream Nail",
  "Howling Wraiths",
  "Isma's Tear",
  "King's Brand",
  "Lumafly Lantern",
  "Mantis Claw",
  "Monarch Wings",
  "Mothwing Cloak",
  "Shade Cloak",
  "Shade Soul",
  "Vengeful Spirit",
  'Shaman Stone',
  'Soul Catcher',
  'Dashmaster',
  "Tram Pass",
]

eventsToTrack = itemsToTrack.map(x => itemToBaseEvent[x])




// const dreamers = [
//   "Herrah",
//   "Lurien",
//   "Monomon",
// ]

// const majorItems = [
//   "Collector's Map",
//   "Abyss Shriek",
//   "Awoken Dream Nail",
//   "Crystal Heart",
//   "Descending Dark",
//   "Desolate Dive",
//   "Dream Gate",
//   "Dream Nail",
//   "Howling Wraiths",
//   "Isma's Tear",
//   "Lumafly Lantern",
//   "Mantis Claw",
//   "Monarch Wings",
//   "Mothwing Cloak",
//   "Shade Cloak",
//   "Shade Soul",
//   "Vengeful Spirit",
// ]

// const minorItems = ["City Crest", "Collector's Map", "Cyclone Slash", "Dash Slash", "Elegant Key", "Great Slash", "Grimmchild", "King Fragment", "King's Brand", "Love Key", "Pale Ore-Basin", "Pale Ore-Colosseum", "Pale Ore-Crystal Peak", "Pale Ore-Grubs", "Pale Ore-Nosk", "Pale Ore-Seer", "Queen Fragment", "Shopkeeper's Key", "Simple Key-Basin", "Simple Key-City", "Simple Key-Lurker", "Simple Key-Sly", "Tram Pass", "Void Heart",]