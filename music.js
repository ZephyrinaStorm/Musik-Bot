const { LavalinkManager } = require('lavalink-client');
function setupMusic(client) {
 const manager = new LavalinkManager({
  nodes:[{id:'main',host:process.env.LAVALINK_HOST,port:Number(process.env.LAVALINK_PORT||2333),authorization:process.env.LAVALINK_PASSWORD,secure:process.env.LAVALINK_SECURE==='true'}],
  sendToShard:(guildId,payload)=>client.guilds.cache.get(guildId)?.shard.send(payload),
  autoSkip:true,
  client:{id:process.env.DISCORD_CLIENT_ID,username:'Musik'}
 });
 client.on('raw',data=>manager.sendRawData(data));
 manager.on('trackStart',(player,track)=>{
  const channel=client.channels.cache.get(player.textChannelId);
  channel?.send({content:`🎶 Now playing: **${track.info?.title||'Unknown'}**`}).catch(()=>{});
 });
 manager.on('playerError',(player,error)=>console.error('Player error',player.guildId,error));
 manager.on('nodeError',(node,error)=>console.error('Lavalink node error',node.id,error));
 return manager;
}
module.exports={setupMusic};
