import Telegraf from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
const bot = new Telegraf(process.env.BOT_TOKEN);

import { ACTION_TYPES } from './actionAndSearchTypes.js';

function Info(chatId, contentId) {
	this.chatId = chatId;
	this.contentId = contentId;
	
	this.displayInfo = async function(actionType) {
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

			let poster = (details.poster_path == null || details.poster_path == undefined ? '' : `https://image.tmdb.org/t/p/original${details.poster_path}`);
			let caption = `<a href = "${poster}"> </a>`;
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
				let rating;
				if(details.vote_average >= 7)
					rating = `🟢`;
				else if(details.vote_average < 7 && details.vote_average > 4)
					rating = `🟡`;
				else
					rating = `🔴`;
				caption += `\n${rating} ${details.vote_average * 10}%`;
			}
			if(details.production_countries != false && details.production_countries != undefined)
				caption += `\n\n✈️ Production Countries: ${details.production_countries.map(a => a.name).join(', ')}`;

			let director = credits.crew.filter(a => a.job == 'Director').map(a => a.name);
			if(director != '')
				caption += `\n\n📽 Director: ${director.join(', ')}`;
			
			if(details.overview != ''){
				caption += `\n\n${details.overview}`;
			}
	
			let keyboard = [[{"text":`Recommendations for "${details.title}"`,"callback_data":ACTION_TYPES.recommendMovies + ':' + details.id + ';' + details.title.substr(0, 38) + (details.title.length > 38 ? '..' : ''),"hide":false}],
							[{"text":`Cast`,"callback_data":ACTION_TYPES.castMovies + ':' + details.id + ';' + details.title.substr(0, 38) + (details.title.length > 38 ? '..' : ''),"hide":false}, 
							 {"text":`Crew`,"callback_data":ACTION_TYPES.crewMovies + ':' + details.id + ';' + details.title.substr(0, 38) + (details.title.length > 38 ? '..' : ''),"hide":false}]];
			
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
			bot.telegram.sendMessage(this.chatId, caption, {"reply_markup": {"inline_keyboard":keyboard}, "parse_mode" : 'HTML'});
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
						

			let photo = (details.profile_path == null || details.profile_path == undefined ? '' : `https://image.tmdb.org/t/p/original${details.profile_path}`);
			let caption = `<a href = "${photo}"> </a>`;
			caption += `<b>👤 ${details.name}</b>`;

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
				caption += `\n\n${details.biography}`;
			}
			
			let keyboard = [[{"text":`Movies`,"callback_data":ACTION_TYPES.starredInMovies + ':' + details.id + ';' + details.name.substr(0, 38) + (details.name.length > 38 ? '..' : ''),"hide":false},
						     {"text":`TV Shows`,"callback_data":ACTION_TYPES.starredInTv + ':' + details.id + ';' + details.name.substr(0, 38) + (details.name.length > 38 ? '..' : ''),"hide":false}]];
					
			if(details.imdb_id != null && details.imdb_id != undefined){
				caption += `\n\n🌐 IMDb: \nhttps://www.imdb.com/name/${details.imdb_id}`;
			}
			bot.telegram.sendMessage(this.chatId, caption,{"reply_markup": {"inline_keyboard":keyboard}, "parse_mode" : 'HTML'});
		}
		else if(actionType == ACTION_TYPES.tvId){
			let detailsURL = `https://api.themoviedb.org/3/tv/${this.contentId}?api_key=${process.env.API_KEY}&language=en-US`;
			let videosURL = `https://api.themoviedb.org/3/tv/${this.contentId}/videos?api_key=${process.env.API_KEY}&language=en-US`;
			let externalIdsURL = `https://api.themoviedb.org/3/tv/${this.contentId}/external_ids?api_key=${process.env.API_KEY}&language=en-US`;
			let details, credits, videos, externalIds;
			
			await fetch(detailsURL, { headers: { 'Content-Type':'application/json' }})
						.then((res) => res.json())
						.then((data) => {
							details = data;
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
			let poster = (details.poster_path == null || details.poster_path == undefined ? '' : `https://image.tmdb.org/t/p/original${details.poster_path}`);
			let caption = `<a href = "${poster}"> </a>`;
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
				let rating;
				if(details.vote_average >= 7)
					rating = `🟢`;
				else if(details.vote_average < 7 && details.vote_average > 4)
					rating = `🟡`;
				else
					rating = `🔴`;
				caption += `\n${rating} ${details.vote_average * 10}%`;
			}
			if(details.production_countries != false && details.production_countries != undefined)
				caption += `\n\n✈️ Production Countries: ${details.production_countries.map(a => a.name).join(', ')}`;

			let creator = details.created_by.map(a => a.name);
			if(creator != '')
				caption += `\n\n📽 Created by: ${creator.join(', ')}`;
			
			if(details.overview != '')
				caption += `\n\n${details.overview}`;	

			let keyboard = [[{"text":`Recommendations for "${details.name}"`,"callback_data":ACTION_TYPES.recommendTv + ':' + details.id + ';' + details.name.substr(0, 38) + (details.name.length > 38 ? '..' : ''),"hide":false}],
							[{"text":`Cast`,"callback_data":ACTION_TYPES.castTv + ':' + details.id + ';' + details.name.substr(0, 38) + (details.name.length > 38 ? '..' : ''),"hide":false}, 
							 {"text":`Crew`,"callback_data":ACTION_TYPES.crewTv + ':' + details.id + ';' + details.name.substr(0, 38) + (details.name.length > 38 ? '..' : ''),"hide":false}]];
			
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
			bot.telegram.sendMessage(this.chatId, caption,{"reply_markup": {"inline_keyboard":keyboard}, "parse_mode" : 'HTML'});
		}
	}
}

export default Info;
