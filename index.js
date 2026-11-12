require('dotenv').config();
const {Client,GatewayIntentBits,REST,Routes,PermissionFlagsBits}=require('discord.js');
const {definitions,CORE,FILTERS,VOICE}=require('./commands');
const {setupMusic}=require('./music');
const {startApi}=require('./api');
for(const key of ['DISCORD_TOKEN','DISCORD_CLIENT_ID','LAVALINK_HOST','LAVALINK_PASSWORD'])if(!process.env[key]){console.error(`Missing ${key}. See .env.example`);process.exit(1)}
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildVoiceStates]});
const manager=setupMusic(client);
const reply=(i,message)=>i.reply({content:String(message).slice(0,1900),ephemeral:true});
function currentPlayer(i){return manager.getPlayer(i.guildId)}
function requireVoice(i){
 const channel=i.member?.voice?.channel;
 if(!channel)throw Error('Join a voice channel first.');
 const p=currentPlayer(i);
 if(p&&p.voiceChannelId!==channel.id)throw Error('Join my voice channel first.');
 return channel;
}
const profiles={flat:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],bass:[.8,.7,.6,.4,.2,0,0,0,0,0,0,0,0,0,0],treble:[0,0,0,0,0,0,0,0,.1,.2,.3,.4,.5,.6,.7],vocal:[-.2,-.2,-.1,0,.2,.4,.5,.5,.3,.1,0,0,0,0,0],warm:[.3,.3,.2,.1,0,0,0,0,-.1,-.1,-.2,-.2,-.2,-.2,-.2],bright:[-.2,-.2,-.1,0,0,0,.1,.1,.2,.3,.4,.4,.5,.5,.5],deep:[.9,.8,.7,.5,.3,.1,0,-.1,-.1,0,0,0,0,0,0],club:[.7,.6,.4,.2,0,-.1,-.1,0,.1,.2,.3,.3,.4,.4,.4],radio:[-.4,-.3,-.2,0,.2,.3,.3,.2,.1,0,-.1,-.2,-.3,-.4,-.4],acoustic:[.1,.1,.2,.2,.3,.2,.1,0,.1,.2,.1,0,0,0,0]};
const scales={soft:.15,low:.3,medium:.45,high:.6,strong:.75,extreme:.9,max:1};
async function run(i){
 const name=i.commandName;
 if(name==='ping')return reply(i,`Pong! ${client.ws.ping}ms`);
 if(name==='help')return reply(i,`Musik has ${definitions().length} slash commands. Try /play, /queue, /skip, /volume, /loop and /eq-bass-medium.`);
 if(name==='invite')return reply(i,`https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot%20applications.commands&permissions=3148800`);
 if(name==='status')return reply(i,`Servers: ${client.guilds.cache.size}; Lavalink nodes: ${manager.nodeManager.nodes.size}`);
 if(!i.guildId)throw Error('Use this command in a server.');
 if(VOICE.has(name))requireVoice(i);
 let p=currentPlayer(i);
 if(['play','search','join'].includes(name)){
  const voice=requireVoice(i);
  if(!p)p=await manager.createPlayer({guildId:i.guildId,voiceChannelId:voice.id,textChannelId:i.channelId,selfDeaf:true,volume:80});
  if(!p.connected)await p.connect();
  if(name==='join')return reply(i,'Joined your voice channel.');
  const query=i.options.getString('query',true);
  const result=await p.search({query,source:'ytsearch',requester:i.user});
  if(!result.tracks?.length)return reply(i,'No tracks found. Check Lavalink source plugins.');
  if(name==='search')return reply(i,result.tracks.slice(0,5).map((t,n)=>`${n+1}. ${t.info.title}`).join('\n'));
  p.queue.add(result.tracks[0]);
  if(!p.playing&&!p.paused)await p.play();
  return reply(i,`Added **${result.tracks[0].info.title}**`);
 }
 if(!p)throw Error('Nothing is playing. Use /play first.');
 const q=p.queue;
 const num=i.options.getInteger('value');
 if(name==='queue')return reply(i,`Now: ${q.current?.info?.title||'None'}\n${q.tracks.slice(0,15).map((t,n)=>`${n+1}. ${t.info.title}`).join('\n')||'Queue empty'}`);
 if(name==='nowplaying')return reply(i,q.current?.info?.title||'Nothing playing.');
 if(name==='pause'){await p.pause();return reply(i,'Paused.');}
 if(name==='resume'){await p.resume();return reply(i,'Resumed.');}
 if(name==='skip'){await p.skip();return reply(i,'Skipped.');}
 if(name==='stop'){await p.destroy();return reply(i,'Stopped and disconnected.');}
 if(name==='disconnect'||name==='leave'){await p.destroy();return reply(i,'Disconnected.');}
 if(name==='volume'){if(num<0||num>150)throw Error('Volume must be 0–150.');await p.setVolume(num);return reply(i,`Volume: ${num}`);}
 if(name==='shuffle'){q.shuffle();return reply(i,'Queue shuffled.');}
 if(name==='loop'){const mode=i.options.getString('mode',true);await p.setRepeatMode(mode==='off'?0:mode==='track'?1:2);return reply(i,`Loop: ${mode}`);}
 if(name==='clear'){q.tracks.splice(0);return reply(i,'Queue cleared.');}
 if(name==='remove'){if(num<1||num>q.tracks.length)throw Error('Invalid queue position.');q.tracks.splice(num-1,1);return reply(i,'Removed.');}
 if(name==='move'){const from=i.options.getInteger('from',true)-1,to=i.options.getInteger('to',true)-1;if(from<0||to<0||from>=q.tracks.length||to>=q.tracks.length)throw Error('Invalid queue positions.');q.tracks.splice(to,0,q.tracks.splice(from,1)[0]);return reply(i,'Moved.');}
 if(name==='jump'){if(num<1||num>q.tracks.length)throw Error('Invalid queue position.');q.tracks.splice(0,num-1);await p.skip();return reply(i,'Jumped to selected track.');}
 if(name==='seek'){if(num<0)throw Error('Seconds must be positive.');await p.seek(num*1000);return reply(i,`Seeked to ${num}s.`);}
 if(name==='replay'){await p.seek(0);return reply(i,'Replaying.');}
 if(name==='previous')return reply(i,'Previous track is not retained by this minimal queue.');
 if(name==='lyrics')return reply(i,'Lyrics require an external lyrics provider; this command is not configured.');
 if(name==='autoplay')return reply(i,'Autoplay requires a recommendation source; not configured.');
 if(name==='bassboost'||name.startsWith('eq-')){
  let gains;
  if(name==='bassboost'){if(num<0||num>100)throw Error('Bassboost value must be 0–100.');gains=profiles.bass.map(x=>x*num/100)}
  else{const parts=name.split('-');gains=profiles[parts[1]].map(x=>x*scales[parts[2]])}
  await p.filterManager.setFilterOptions({equalizer:gains.map((gain,band)=>({band,gain}))});
  return reply(i,`Applied ${name} equalizer.`);
 }
 if(name==='nightcore'){await p.filterManager.setFilterOptions({timescale:{speed:1.15,pitch:1.15,rate:1}});return reply(i,'Nightcore applied.');}
 if(name==='vaporwave'){await p.filterManager.setFilterOptions({timescale:{speed:.85,pitch:.85,rate:1}});return reply(i,'Vaporwave applied.');}
 throw Error('Command not implemented.');
}
client.on('interactionCreate',async i=>{
 if(!i.isChatInputCommand())return;
 try{await run(i)}catch(e){console.error(i.commandName,e);const msg=`❌ ${e.message||'Unexpected error'}`;try{if(i.replied||i.deferred)await i.followUp({content:msg,ephemeral:true});else await reply(i,msg)}catch{}}
});
client.once('ready',async()=>{
 console.log(`Logged in as ${client.user.tag}`);
 await manager.init({id:client.user.id,username:client.user.username});
 const rest=new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN);
 try{const route=process.env.DISCORD_GUILD_ID?Routes.applicationGuildCommands(client.user.id,process.env.DISCORD_GUILD_ID):Routes.applicationCommands(client.user.id);await rest.put(route,{body:definitions()});console.log('Registered 100 slash commands')}catch(e){console.error('Command registration failed',e)}
 startApi(client,manager);
});
client.login(process.env.DISCORD_TOKEN).catch(e=>{console.error('Login failed',e);process.exit(1)});
