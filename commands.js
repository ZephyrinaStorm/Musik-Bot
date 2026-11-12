const { SlashCommandBuilder } = require('discord.js');
const CORE = ["play", "search", "pause", "resume", "skip", "stop", "disconnect", "queue", "nowplaying", "volume", "shuffle", "loop", "clear", "remove", "move", "jump", "seek", "replay", "previous", "lyrics", "ping", "help", "invite", "status", "join", "leave", "autoplay", "bassboost", "nightcore", "vaporwave"];
const PROFILES = ["flat", "bass", "treble", "vocal", "warm", "bright", "deep", "club", "radio", "acoustic"];
const LEVELS = ["soft", "low", "medium", "high", "strong", "extreme", "max"];
const FILTERS = PROFILES.flatMap(p => LEVELS.map(l => `eq-${p}-${l}`));
const VOICE = new Set(['play','search','pause','resume','skip','stop','disconnect','volume','shuffle','loop','clear','remove','move','jump','seek','replay','previous','join','leave','autoplay','bassboost','nightcore','vaporwave', ...FILTERS]);
function definitions() {
 return [...CORE,...FILTERS].map(name => {
  const cmd = new SlashCommandBuilder().setName(name).setDescription(name.startsWith('eq-') ? `Set the ${name.slice(3).replaceAll('-', ' ')} equalizer preset` : `Musik: ${name} command`);
  if(['play','search'].includes(name)) cmd.addStringOption(o=>o.setName('query').setDescription('Song name or URL').setRequired(true));
  if(['volume','seek','remove','jump','bassboost'].includes(name)) cmd.addIntegerOption(o=>o.setName('value').setDescription('Value, seconds, or queue position').setRequired(true));
  if(name==='move') cmd.addIntegerOption(o=>o.setName('from').setDescription('Current position').setRequired(true)).addIntegerOption(o=>o.setName('to').setDescription('New position').setRequired(true));
  if(name==='loop') cmd.addStringOption(o=>o.setName('mode').setDescription('Loop mode').setRequired(true).addChoices({name:'Off',value:'off'},{name:'Track',value:'track'},{name:'Queue',value:'queue'}));
  return cmd.toJSON();
 });
}
module.exports = { definitions, CORE, FILTERS, VOICE };
