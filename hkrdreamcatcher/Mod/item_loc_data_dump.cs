using Modding;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using UnityEngine;
using WebSocketSharp.Server;

namespace DreamCatcher
{
    public class HKItemLocDataDump : Mod, ITogglableMod
    {
        public override int LoadPriority() => 9999;
        private readonly WebSocketServer _wss = new WebSocketServer(10051);
        internal static HKItemLocDataDump Instance;
        public static Dictionary<string, string> smallAreaToGeneralArea;

        // TODO: Put in external file.

        public HKItemLocDataDump()
        {
            Stream smallAreaToGeneralAreaStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("DreamCatcher.small_area_to_general_area_mapping.csv");
            using (StreamReader inputFile = new StreamReader(smallAreaToGeneralAreaStream))
            {
                smallAreaToGeneralArea = inputFile.ReadToEnd()
                    .Split(new string[] { "\r\n" }, StringSplitOptions.None)
                    .Select(s => s.Split(',')).ToDictionary(x => x[0], x => x[1]);
            }
        }

        public override void Initialize()
        {
            Instance = this;

            Log("[...] Initializing Dreamcatcher HKItemLocDataDump Socket.");
            _wss.AddWebSocketService<SocketServer>("/data", ss =>
            {
                ModHooks.Instance.SavegameLoadHook += ss.OnLoadSave;
                ModHooks.Instance.ApplicationQuitHook += ss.OnQuit;
                ModHooks.Instance.SetPlayerBoolHook += ss.MessageBool;
                ModHooks.Instance.SetPlayerIntHook += ss.MessageInt;
                On.GameManager.BeginSceneTransition += ss.ManageTransitions;
            });

            _wss.Start();
            Log("[OK] Initialized Dreamcatcher HKItemLocDataDump Socket.");

        }
        public override string GetVersion() => Assembly.GetExecutingAssembly().GetName().Version.ToString();

        public static string GetSpoilerLog()
        {
            string userDataPath = System.IO.Path.Combine(Application.persistentDataPath, "RandomizerSpoilerLog.txt");
            return System.IO.File.ReadAllText(userDataPath);
        }

        private static string RegexSpoilerLog(string rawSpoilerText)
        {
            string spoilerText = Regex.Replace(rawSpoilerText, @"\r", "", RegexOptions.Multiline); // Weird windows thing.
            spoilerText = Regex.Match(spoilerText, @"ALL ITEMS[\s\S]*", RegexOptions.Multiline).Value;  // Only take the ALL ITEMS part and beyond.
            spoilerText = Regex.Replace(spoilerText, @"ALL ITEMS", "", RegexOptions.Multiline); // Remove ALL ITEMS text.
            spoilerText = Regex.Replace(spoilerText, @" ?\(\d+\) ?", "", RegexOptions.Multiline); // Remove progression values.
            spoilerText = Regex.Replace(spoilerText, @" ?\(Key\) ?", "", RegexOptions.Multiline); // Remove "Key" text.
            spoilerText = Regex.Replace(spoilerText, @" \[.+?\]", "", RegexOptions.Multiline); // Remove cost information.
            spoilerText = Regex.Replace(spoilerText, @"<---at--->.*", "", RegexOptions.Multiline); // Remove "At" and everything after the at.  We know the loc already.
            spoilerText = Regex.Replace(spoilerText, @"SETTINGS[\s\S]*", "", RegexOptions.Multiline); // Remove Settings.
            return spoilerText;
        }

        public static string ParseRegexedSpoilerLog(string rawSpoilerText)
        {
            string spoilerText = RegexSpoilerLog(rawSpoilerText);
            // Replace the specific area with general areas above.
            foreach (KeyValuePair<string, string> kvp in smallAreaToGeneralArea) spoilerText = Regex.Replace(spoilerText, kvp.Key, kvp.Value, RegexOptions.Multiline);

            // Splitting up the spoiler so it looks like: "areaname: item1, item2, item3, ..." 
            var spoilerArray = spoilerText
              .Split(new[] { "\n\n" }, StringSplitOptions.None)
              .Where(x => !String.IsNullOrEmpty(x))
              .ToList();

            // Creates the area-to-items dictionary.
            int acc = 0;
            var areaItemDict = new Dictionary<string, List<string>>();
            foreach (string row in spoilerArray)
            {
                string area_ = row.Split('\n')[0].TrimEnd(':');

                if (areaItemDict.ContainsKey(area_)) { continue; }
                else areaItemDict[area_] = new List<string>();

                // Go through every string (after the current area) and put in the items that correspond to a row for that area.
                // Note the area rows are NOT unique (there's more than one row with the same area) as we regex'd
                // from specific area to general area above.
                for (int jdx = acc; jdx < spoilerArray.Count(); jdx++)
                {
                    string[] splitstr2 = spoilerArray[jdx].Split('\n');
                    if (splitstr2[0].TrimEnd(':') != area_) continue;

                    // It looks like [area, item1, item2, ...] so we skip 1 to exclude area:
                    foreach (string item in splitstr2.Skip(1)) areaItemDict[area_].Add(item);
                }
                acc += 1;
            }

            // Sort the areas alphabetically.
            SortedDictionary<string, List<string>> areaItemDictCleaned = new SortedDictionary<string, List<string>>(
              areaItemDict.Where(x => x.Value.Count > 0).ToDictionary(x => x.Key, x => x.Value)
            );
            return JsonConvert.SerializeObject(areaItemDictCleaned);
        }

        /// <summary>
        /// Called when the mod is disabled; stops webserver and removes socket.
        /// </summary>
        public void Unload()
        {
            _wss.Stop();
            _wss.RemoveWebSocketService("/data");
        }
    }
}
