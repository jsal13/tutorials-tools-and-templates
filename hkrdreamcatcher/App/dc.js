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

// handleMessage('{"event_key": "item", "event_type": "hasDesolateDive", "event_value": true, "event_location": "Abyss"}')

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

            // Send spoiler if dc log doesn't exist, or send dc log.
            ws.send("/refresh-dc-log")

            intervalTasks = window.setInterval(() => {
              try {
                ws.send("/ping-dreamers")
                ws.send("/refresh-dc-log")
              } catch (DOMException) {
                clearInterval(intervalTasks)
              }
            }, 10000)
            break;

          case "closed":
            // TODO: Do I need this?
            clearInterval(intervalTasks)
            break;
        }
        break;

      case "game_level_event":
        switch (eventVal) {

          case "new_game":
            console.log("[OK] New Game Detected, Loading Spoilers...")
            ws.send("/get-spoiler-log")
            break;

          case "load_game":
            console.log("[OK] Loading spoilers...")
            ws.send("/refresh-dc-log")
            break;
        }
        break;

      case "ping_event":
        switch (eventType) {

          case "spoiler":
            var sp = JSON.parse(eventVal)
            parseSpoilerLog(sp)
            ws.send(`/update-dc-log ${JSON.stringify(window.spoilerData)}`)
            plotItemsOnPage()
            break;

          case "found_items":
            console.log(eventVal)
            // console.log(JSON.parse(eventVal))
            window.spoilerData = JSON.parse(eventVal)
            plotItemsOnPage()
            break;

          case "dreamer":
            // BUG: Pingdreamers will add an additional entry to your list if you restart the game.
            // It pings, knows you have the dreamer, but puts the new area in.
            ws.send(`/update-dc-log ${JSON.stringify(window.spoilerData)}`)
            break;
        }
        break;

      case "item":
        if (eventVal && eventsToTrack.includes(eventToBaseEvent[eventType] || eventType) && eventCurrentArea !== '') {
          toggleFoundInSpoiler(_eventTypeBase, eventCurrentArea)
          ws.send(`/update-dc-log ${JSON.stringify(window.spoilerData)}`)
        }
        break;

      case "exception":
        console.log("Exception", eventVal);
        break;

      default:
        break;
    }
  } catch (e) {
    console.log("[ERROR] Didn't parse:", m, e)
  }
}

function toggleFoundInSpoiler(eventType, eventCurrentArea) {

  const _areaData = window.spoilerData[eventCurrentArea]
  try {
    for (var idx = 0; idx < _areaData.length; idx++) {
      if (_areaData[idx]["event"] === eventType && !_areaData[idx]["found"]) {
        _areaData[idx]["found"] = true
        console.log("marking off", _areaData[idx])
        break;
      }
    }
    plotItemsOnPage()
  } catch (ex) {
    console.log(eventType, eventCurrentArea, ex);
  }
}

function parseSpoilerLog(spoilerJSON) {
  // Note: here we take eventToBaseItem[itemToBaseEvent[i]] since we're mapping a collection of many possible
  // items to a single base event, then mapping that event to a single base item.  Think: grubs in diff locs, etc.

  window.spoilerData = Object.entries(spoilerJSON)
    .map(x => { return [x[0], x[1].filter(s => itemsToTrack.includes(s))] }) // filters out unwanted items.
    .filter(x => x[1].length > 0) // filters empty areas
    .map(x => { return [x[0], x[1].map(i => { return { 'item': eventToBaseItem[itemToBaseEvent[i]], 'found': false, 'show': true, 'event': itemToBaseEvent[i] } })] })

  window.spoilerData = Object.fromEntries(window.spoilerData)
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

function plotItemsOnPage() {
  $("#tracker-table").empty()

  var html_ = ""
  const areas = Object.keys(window.spoilerData)

  for (var idx = 0; idx < areas.length; idx++) {
    const thisAreaItems = window.spoilerData[areas[idx]]
    const thisAreaLocData = areas[idx]
    const [divStyle, circleStyle] = makeDivCSS(areas[idx])
    var trackerImagesHTML = ""

    for (var jdx = 0; jdx < thisAreaItems.length; jdx++) {
      if (thisAreaItems[jdx]["show"]) {
        var _event = thisAreaItems[jdx]["event"];
        var _item = thisAreaItems[jdx]["item"];
        var _found = thisAreaItems[jdx]["found"]

        trackerImagesHTML += `
        <div class="tracker-image">
          <img class="item-image ${_found ? 'item-found' : ''} ${_event}_${thisAreaLocData}" src="./images/${_item}.png"/>
        </div>`
      }
    }

    if (trackerImagesHTML !== "") {
      html_ += `
    <div class="area-pill">
      <div class="area-pill-inner" style="${divStyle}">
        <div class="area-pill-rounded-edge" style="${circleStyle}">
          <div class="area-pill-area-title-div">
            <span class="area-pill-area-title-text">${locData[thisAreaLocData]["abbr"]}</span>
          </div>
        </div>
        <div class="pill-items-container">
          ${trackerImagesHTML}
        </div>
      </div>
    </div>`
    }
  }
  $("#tracker-table").append(html_)
}

function dimItemFound(itemEvent, locWithUnderscores) {
  // Due to the 10 second lag and the uniqueness of the dreamers, we should just look for their name.
  // var _loc = ["Monomon", "Lurien", "Herrah"].includes(itemEvent) ? "" : `_${locWithUnderscores}`
  // const selector = $(`img[class*="${itemEvent}${_loc}"]:not(.item-found)`)

  // if (typeof selector !== 'undefined' && selector.length > 0) {
  //   console.log("Okay, dimming:", itemEvent, locWithUnderscores)
  //   selector.first().addClass("item-found")
  // }

}

// =========
// CONSTANTS
// =========
const locData = {
  'Abyss': { background: "#707170", border: "#242524", abbr: "Abyss" },
  'Ancient_Basin': { background: "#73747d", border: "#282a37", abbr: "AnBsn" },
  'City_of_Tears': { background: "#6b89a9", border: "#1b4a7b", abbr: "CityT" },
  'Crystal_Peak': { background: "#b588b0", border: "#95568f", abbr: "CryPk" },
  'Deepnest': { background: "#666b80", border: "#141c3c", abbr: "DNest" },
  'Dirtmouth': { background: "#787994", border: "#2f315b", abbr: "Dirtm" },
  'Fog_Canyon': { background: "#9da3bd", border: "#5b6591", abbr: "FogCn" },
  'Forgotten_Crossroads': { background: "#687796", border: "#202d5d", abbr: "XRoad" },
  'Fungal_Wastes': { background: "#58747c", border: "#113945", abbr: "FungW" },
  'Greenpath': { background: "#679487", border: "#155b47", abbr: "GPath" },
  'Hive': { background: "#C17F6E", border: "#A64830", abbr: "Hive" },
  'Howling_Cliffs': { background: "#75809a", border: "#3b4a6f", abbr: "HClif" },
  'Kingdoms_Edge': { background: "#768384", border: "#3c4e50", abbr: "KEdge" },
  'Queens_Gardens': { background: "#559f9d", border: "#0d7673", abbr: "QGdn" },
  'Resting_Grounds': { background: "#84799d", border: "#423169", abbr: "RestG" },
  'Royal_Waterways': { background: "#6d919d", border: "#1e5669", abbr: "RWatr" },
}

// Ore, Simplekeys is weird.  Ore has a += 1 sort of thing going on when you collect it, so it has to be treated differently.

// Only upgrade items appear here.
eventToBaseEvent = {
  "hasAbyssShriek": "hasHowlingWraiths",
  "hasDescendingDark": "hasDesolateDive",
  "hasDreamGate": "hasDreamNail",
  "dreamNailUpgraded": "hasDreamNail",
  "hasShadowDash": "hasDash",
  "hasShadeSoul": "hasVengefulSpirit"
}

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