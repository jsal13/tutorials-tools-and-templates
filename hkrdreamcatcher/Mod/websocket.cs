using Modding;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using UnityEngine;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace DreamCatcher
{
    internal class SocketServer : WebSocketBehavior
    {
        private bool messagedHerrah = false;
        private bool messagedMonomon = false;
        private bool messagedLurien = false;

        private readonly StreamReader srRoomMapper = new StreamReader(Assembly.GetExecutingAssembly().GetManifestResourceStream("DreamCatcher.room_mappings.csv"));
        private readonly StreamReader srEventsToIgnore = new StreamReader(Assembly.GetExecutingAssembly().GetManifestResourceStream("DreamCatcher.events_to_ignore.csv"));
        private readonly Dictionary<string, string> roomMappings;
        private readonly List<string> ignoreEvent;

        private readonly string dreamCatcherPath = Path.Combine(Application.persistentDataPath, "DreamCatcherSpoilerLog.csv");

        public SocketServer()
        {
            IgnoreExtensions = true;

            // Load the roomMappings and eventsToIgnore.
            string[] stringSeps = new string[] { "\r\n" };
            using (srRoomMapper) this.roomMappings = srRoomMapper
              .ReadToEnd().Split(stringSeps, StringSplitOptions.None).Select(s => s.Split(',')).ToDictionary(x => x[0], x => x[1]);
            using (srEventsToIgnore) this.ignoreEvent = srEventsToIgnore.ReadToEnd().Split(stringSeps, StringSplitOptions.None).ToList();
        }

        private string MakeEvent(string eventName, string eventType, string eventValue, string eventLocation = "") =>
          JsonConvert.SerializeObject(new Dictionary<string, string>() {
            { "event_key", eventName },
            { "event_type", eventType },
            { "event_value", eventValue },
            { "event_location", eventLocation }
        });

        public void Broadcast(string s) => Sessions.Broadcast(s);

        protected override void OnOpen() {
            Send(MakeEvent("websocket", "websocket_status", "open"));
        }


        protected override void OnClose(CloseEventArgs e)
        {
            Send(MakeEvent("websocket", "websocket_status", "closed"));
            ModHooks.Instance.SavegameLoadHook -= OnLoadSave;
            ModHooks.Instance.SetPlayerBoolHook -= MessageBool;
            ModHooks.Instance.SetPlayerIntHook -= MessageInt;
            ModHooks.Instance.ApplicationQuitHook -= OnQuit;
            On.GameManager.BeginSceneTransition -= ManageTransitions;
            base.OnClose(e);
        }
        protected override void OnError(WebSocketSharp.ErrorEventArgs e) => Send(e.Message);
        public void OnLoadSave(int _slot) => Send(MakeEvent("game_level_event", "game_level_event", "load_game"));
        public void OnQuit() => Send(MakeEvent("game_level_event", "game_level_event", "quit_game"));

        protected override void OnMessage(MessageEventArgs e)
        {
            try
            {
                switch (e.Data)
                {
                    case "/get-spoiler-log":
                        Send(MakeEvent("ping_event", "spoiler", HKItemLocDataDump.ParseRegexedSpoilerLog(HKItemLocDataDump.GetSpoilerLog())));
                        break;

                    case "/ping-dreamers":
                        if (PlayerData.instance.monomonDefeated && !messagedMonomon) { Send(MakeEvent("ping_event", "dreamer", "Monomon")); messagedMonomon = true; }
                        if (PlayerData.instance.lurienDefeated && !messagedLurien) { Send(MakeEvent("ping_event", "dreamer", "Lurien")); messagedLurien = true; }
                        if (PlayerData.instance.hegemolDefeated && !messagedHerrah) { Send(MakeEvent("ping_event", "dreamer", "Herrah")); messagedHerrah = true; }
                        break;

                    case "/refresh-dc-log":
                        // Gets contents of DC log for items already got, then sends them to the js side; if user refreshes webpage, eg.
                        try
                        {
                            using (FileStream fs = new FileStream(this.dreamCatcherPath, FileMode.Open, FileAccess.Read))
                            {
                                using (StreamReader sr = new StreamReader(fs))
                                {
                                    string _line = sr.ReadLine().ToString();
                                    Send(MakeEvent("ping_event", "found_items", $"{_line}"));
                                }
                            }
                        } 
                        catch
                        {
                            Send(MakeEvent("ping_event", "spoiler", HKItemLocDataDump.ParseRegexedSpoilerLog(HKItemLocDataDump.GetSpoilerLog())));
                        }
                        break;

                    default:
                        // add-to-dc-log has a payload arg after it; not sure how else to put it in this switch statement.
                        if (e.Data.StartsWith("/update-dc-log"))
                        {
                            using (FileStream fs = new FileStream(this.dreamCatcherPath, FileMode.OpenOrCreate, FileAccess.ReadWrite))
                            {
                                using (StreamWriter sw = new StreamWriter(fs))
                                {
                                    fs.SetLength(0);
                                    sw.WriteLine($"{e.Data.Remove(0, 15)}");
                                }
                            }
                        }
                        break;
                }
            } catch (Exception ex)
            {
                Send(ex.Message);
            }
        }

        /// See: https://radiance.host/apidocs/Hooks.html for the following hook details.
        private bool ShouldNotProcessEvent(string eventMessage)
        {
            bool ignoredEvent = this.ignoreEvent.Contains(eventMessage);
            bool ignoredStartsWith = (eventMessage.StartsWith("killed") || eventMessage.StartsWith("kills") || eventMessage.StartsWith("newData") || eventMessage.StartsWith("opened"));
            return ignoredEvent|| ignoredStartsWith;
        }

        public void MessageBool(string eventMessage, bool value)
        {
            try
            {
                if (ShouldNotProcessEvent(eventMessage)) { return; }

                UnityEngine.SceneManagement.Scene scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                var lowercaseBool = value ? "true" : "false";
                string roomName = (string)this.roomMappings[scene.name];
                Send(MakeEvent("item", eventMessage, lowercaseBool, roomName));
            }
            catch
            {
                // TODO: Debug to see what it's catching.
                return;
            }
        }

        public void MessageInt(string eventMessage, int value)
        {
            try
            {
                if (ShouldNotProcessEvent(eventMessage)) { return; }

                UnityEngine.SceneManagement.Scene scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
                string roomName = (string)this.roomMappings[scene.name];
                Send(MakeEvent("item", eventMessage, value.ToString(), roomName));
            }
            catch
            {
                // TODO: Debug to see what it's catching.
                return;
            }
        }

        public void ManageTransitions(On.GameManager.orig_BeginSceneTransition orig, GameManager self, GameManager.SceneLoadInfo info)
        {
            // The only thing we need here is to see if the user is making a new game.
            if (info.SceneName == "GG_Entrance_Cutscene") Send(MakeEvent("game_level_event", "game_level_event", "new_game"));
            orig(self, info);
        }
    }
}