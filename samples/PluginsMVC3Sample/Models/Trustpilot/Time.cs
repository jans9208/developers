using System;
using System.Globalization;

namespace PluginsMVC3Sample.Models.Trustpilot
{
	public class Time
	{
        public long UnixTime { get; set; }
        public string Human { get; set; }
        public string HumanDate { get; set; }
	}
}
