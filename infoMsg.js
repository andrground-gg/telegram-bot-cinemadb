const { Telegraf } = require('telegraf');
require('dotenv').config();
const fetch = require('node-fetch');
const { Keyboard, Key } = require('telegram-keyboard');
const { callback } = Key;
const bot = new Telegraf(process.env.BOT_TOKEN);

const ACTION_TYPES = {
    movieId: 'movieId',
	personId: 'personId',
	tvId : 'tvId',
    page: 'page',
	recommendMovies: 'recommendMovies',
	recommendTv: 'recommendTv',
	starredInMovies : 'starredInMovies',
	starredInTv : 'starredInTv',
	castMovies: 'castMovies',
	crewMovies: 'crewMovies',
	castTv : 'castTv',
	crewTv : 'crewTv',
	popularMovies : 'popularMovies',
	popularPeople : 'popularPeople',
	popularTv : 'popularTv'
}

function Info(chatId, contentId) {
	this.chatId = chatId;
	this.contentId = contentId;
	
	this.displayInfo = async function(actionType){
		if(actionType == ACTION_TYPES.movieId){
			let detailsURL = `https://api.themoviedb.org/3/movie/${this.contentId}?api_key=${process.env.API_KEY}&language=en-US`;
			let creditsURL = `https://api.themoviedb.org/3/movie/${this.contentId}/credits?api_key=${process.env.API_KEY}&language=en-US`;
			let videosURL = `https://api.themoviedb.org/3/movie/${this.contentId}/videos?api_key=${process.env.API_KEY}&language=en-US`;
			let details, credits, videos;
			
			await fetch(detailsURL, { headers: { 'Content-Type':'application/json' }})
						.then((res) => res.json())
						.then((data) => {
							details = data;
						})
						.catch((err) => console.log(err));
						
			await fetch(creditsURL, { headers: { 'Content-Type':'application/json' }})
						.then((res) => res.json())
						.then((data) => {
							credits = data;
						})
						.catch((err) => console.log(err));
			
			await fetch(videosURL, { headers: { 'Content-Type':'application/json' }})
						.then((res) => res.json())
						.then((data) => {
							videos = data;
						})
						.catch((err) => console.log(err));					
			
			let caption = '';
			caption += `🎬 <b>${details.title}</b>`;

			if(details.tagline != '')
				caption += `\n<i>${details.tagline}</i>`;
			caption += `\n`;
			
			if(details.genres != false){
				caption += `\n🎭 ${details.genres.map(g => g.name).join(', ')}`;
			}
			
			if(details.release_date != undefined && details.release_date != ''){
				let splitDate = details.release_date.split('-');
				let date = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]).toString().substring(4, 15);
				caption += `\n🗓 ${date}`;
			}
			if(details.runtime != null && details.runtime != 0){
				caption += `\n🕔 `;
				if(parseInt(details.runtime / 60) != 0)
					caption += `${parseInt(details.runtime / 60)}h `;
				caption += `${details.runtime % 60}min`;
			}
			if(details.vote_average != ''){
				if(details.vote_average >= 7)
					rating = `🟢`;
				else if(details.vote_average < 7 && details.vote_average > 4)
					rating = `🟡`;
				else
					rating = `🔴`;
				caption += `\n${rating} ${details.vote_average * 10}%`;
			}
			if(details.overview != ''){
				caption += `\n\n${details.overview.substr(0, 750)}`;
				if(caption.length > 750)
					caption += '...';
			}
			
			let poster = (details.poster_path == null || details.poster_path == undefined ? {source : "img/placeholder.png"} : `https://image.tmdb.org/t/p/original${details.poster_path}`);

			let keyboard = [[{"text":`Recommendations for "${details.title}"`,"callback_data":ACTION_TYPES.recommendMovies + ':' + details.id + ';' + details.title.substr(0, 40) + (details.title.length > 40 ? '..' : ''),"hide":false}],
							[{"text":`Cast`,"callback_data":ACTION_TYPES.castMovies + ':' + details.id + ';' + details.title.substr(0, 40) + (details.title.length > 40 ? '..' : ''),"hide":false}, 
							 {"text":`Crew`,"callback_data":ACTION_TYPES.crewMovies + ':' + details.id + ';' + details.title.substr(0, 40) + (details.title.length > 40 ? '..' : ''),"hide":false}]];
			
			let trailers = '';
			if(videos.results != false){
				for(let v = 0; v < videos.results.length; v++){
					if(videos.results[v].site == 'YouTube' && videos.results[v].type == 'Trailer'){
						if(trailers == '')
							trailers += `\n\n🎥 Trailers:`
						trailers += `\nhttps://youtu.be/${videos.results[v].key}`;
					}
				}
			}
			
			if(details.imdb_id != null && details.imdb_id != undefined){
				caption += `\n\n🌐 IMDb: \nhttps://www.imdb.com/title/${details.imdb_id}`;
			}
			
			caption += trailers;
			bot.telegram.sendPhoto(this.chatId, poster,{"reply_markup": {"inline_keyboard":keyboard}, "caption": caption, "parse_mode" : 'HTML'});
		}
		else if(actionType == ACTION_TYPES.personId){
			let detailsURL = `https://api.themoviedb.org/3/person/${this.contentId}?api_key=${process.env.API_KEY}&language=en-US`;

			let details;
			
			await fetch(detailsURL, { headers: { 'Content-Type':'application/json' }})
						.then((res) => res.json())
						.then((data) => {
							details = data;
						})
						.catch((err) => console.log(err));
						

			
			let caption = '';
			caption += ` <b>👤 ${details.name}</b>`;

			if(details.known_for_department != '')
				caption +=`\n💼 ${details.known_for_department}`;
			caption += `\n`;
			
			let birthDate = '';
			if((details.birthday != undefined && details.birthday != null) || (details.place_of_birth != undefined && details.place_of_birth != null)){
				caption += `\n🎂 `;
				if(details.birthday != undefined && details.birthday != null){
					let splitDate = details.birthday.split('-');
					birthDate = new Date(splitDate[0], splitDate[1] - 1, splitDate[2]);
					caption += birthDate.toString().substring(4, 15);
					if(details.deathday == undefined || details.deathday == null){
						let today = new Date();		
						caption += ` (${today.getFullYear() - birthDate.getFullYear() - (today.getMonth() < birthDate.getMonth() || (today.getMonth() == birthDate.getMonth() && today.getDate() < birthDate.getDate())? 1 : 0)} Years)`;
					}
				}
				if(details.place_of_birth != undefined && details.place_of_birth != null){
					if(details.birthday != undefined && details.birthday != null)
						caption += ', ';
					caption += details.place_of_birth;
				}
			}
			if(details.deathday != undefined && details.deathday != null){
				let splitDate = details.deathday.split('-');
				let deathDate = new Date(splitDate[0], splitDate[1] - 1, splitDate[2])
				caption += `\n⚰️ ${deathDate.toString().substring(4, 15)}`;
				if(birthDate != '')
					caption += ` (${deathDate.getFullYear() - birthDate.getFullYear() - (deathDate.getMonth() < birthDate.getMonth() || (deathDate.getMonth() == birthDate.getMonth() && deathDate.getDate() < birthDate.getDate())? 1 : 0)} Years)`;
			}

			if(details.biography != ''){
				caption += `\n\n${details.biography.substr(0, 800)}`;
				if(caption.length > 800)
					caption += '...';
			}
			
			let photo = (details.profile_path == null || details.profile_path == undefined ? {source : "img/placeholder.png"} : `https://image.tmdb.org/t/p/original/${details.profile_path}`);
			
			let keyboard = [[{"text":`Movies`,"callback_data":ACTION_TYPES.starredInMovies + ':' + details.id + ';' + details.name,"hide":false},
						     {"text":`TV Shows`,"callback_data":ACTION_TYPES.starredInTv + ':' + details.id + ';' + details.name,"hide":false}]];
					
			if(details.imdb_id != null && details.imdb_id != undefined){
				caption += `\n\n🌐 IMDb: \nhttps://www.imdb.com/name/${details.imdb_id}`;
			}
			bot.telegram.sendPhoto(this.chatId, photo,{"reply_markup": {"inline_keyboard":keyboard}, "caption": caption, "parse_mode" : 'HTML'});
		}
		else if(actionType == ACTION_TYPES.tvId){
			let detailsURL = `https://api.themoviedb.org/3/tv/${this.contentId}?api_key=${process.env.API_KEY}&language=en-US`;
			let creditsURL = `https://api.themoviedb.org/3/tv/${this.contentId}/aggregate_credits?api_key=${process.env.API_KEY}&language=en-US`;
			let videosURL = `https://api.themoviedb.org/3/tv/${this.contentId}/videos?api_key=${process.env.API_KEY}&language=en-US`;
			let externalIdsURL = `https://api.themoviedb.org/3/tv/${this.contentId}/external_ids?api_key=${process.env.API_KEY}&language=en-US`;
			let details, credits, videos, externalIds;
			
			await fetch(detailsURL, { headers: { 'Content-Type':'application/json' }})
						.then((res) => res.json())
						.then((data) => {
							details = data;
						})
						.catch((err) => console.log(err));
						
			await fetch(creditsURL, { headers: { 'Content-Type':'application/json' }})
						.then((res) => res.json())
						.then((data) => {
							credits = data;
						})
						.catch((err) => console.log(err));
			
			await fetch(videosURL, { headers: { 'Content-Type':'application/json' }})
						.then((res) => res.json())
						.then((data) => {
							videos = data;
						})
						.catch((err) => console.log(err));					
			
			await fetch(externalIdsURL, { headers: { 'Content-Type':'application/json' }})
						.then((res) => res.json())
						.then((data) => {
							externalIds = data;
						})
						.catch((err) => console.log(err));

			let caption = '';
			caption += `📺 <b>${details.name}</b>`;
			
			if(details.tagline != '')
				caption += `\n<i>${details.tagline}</i>`;
			caption += `\n`;
			
			if(details.genres != false){
				caption += `\n🎭 ${details.genres.map(g => g.name).join(', ')}`;
			}
			
			if(details.first_air_date != undefined && details.first_air_date != ''){
				let firstDate = details.first_air_date.split('-');
				let fdate = new Date(firstDate[0], firstDate[1] - 1, firstDate[2]).toString().substring(4, 15);
				
				let ldate = '...'
				if(details.in_production == false){
					let lastDate = details.last_air_date.split('-');
					ldate = new Date(lastDate[0], lastDate[1] - 1, lastDate[2]).toString().substring(4, 15);
				}
				caption += `\n🗓 ${fdate} - ${ldate}`;
			}
			if(details.number_of_seasons != 0)
				caption += `\n📁 Seasons: ${details.number_of_seasons}`;
			if(details.number_of_episodes != 0)
				caption += `\n📃 Episodes: ${details.number_of_episodes}`;
			if(details.episode_run_time != false && details.episode_run_time != undefined)
				caption += `\n🕔 ${details.episode_run_time[0]}min`;
			if(details.vote_average != ''){
				if(details.vote_average >= 7)
					rating = `🟢`;
				else if(details.vote_average < 7 && details.vote_average > 4)
					rating = `🟡`;
				else
					rating = `🔴`;
				caption += `\n${rating} ${details.vote_average * 10}%`;
			}
			if(details.overview != ''){
				caption += `\n\n${details.overview.substr(0, 750)}`;
				if(caption.length > 750)
					caption += '...';
			}
			
			let poster = (details.poster_path == null || details.poster_path == undefined ? {source : "img/placeholder.png"} : `https://image.tmdb.org/t/p/original${details.poster_path}`);

			let keyboard = [[{"text":`Recommendations for "${details.name}"`,"callback_data":ACTION_TYPES.recommendTv + ':' + details.id + ';' + details.name.substr(0, 40) + (details.name.length > 40 ? '..' : ''),"hide":false}],
							[{"text":`Cast`,"callback_data":ACTION_TYPES.castTv + ':' + details.id + ';' + details.name.substr(0, 40) + (details.name.length > 40 ? '..' : ''),"hide":false}, 
							 {"text":`Crew`,"callback_data":ACTION_TYPES.crewTv + ':' + details.id + ';' + details.name.substr(0, 40) + (details.name.length > 40 ? '..' : ''),"hide":false}]];
			
			let trailers = '';
			if(videos.results != false){
				for(let v = 0; v < videos.results.length; v++){
					if(videos.results[v].site == 'YouTube' && videos.results[v].type == 'Trailer'){
						if(trailers == '')
							trailers += `\n\n🎥 Trailers:`
						trailers += `\nhttps://youtu.be/${videos.results[v].key}`;
					}
				}
			}
			
			if(externalIds.imdb_id != null && externalIds.imdb_id != undefined){
				caption += `\n\n🌐 IMDb: \nhttps://www.imdb.com/title/${externalIds.imdb_id}`;
			}
			
			caption += trailers;
			bot.telegram.sendPhoto(this.chatId, poster,{"reply_markup": {"inline_keyboard":keyboard}, "caption": caption, "parse_mode" : 'HTML'});
		}
	}
}

module.exports = Info;