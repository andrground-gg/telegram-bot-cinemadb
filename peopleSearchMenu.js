import Telegraf from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

import SearchMenu from './searchMenu.js';

import { ACTION_TYPES, SEARCH_TYPES } from './actionAndSearchTypes.js';

function PeopleSearchMenu(chatId, actionType, query = '', contentId = '') {
	this.page = 1;
	this.chatId = chatId;
	this.msgId = '';
	this.query = query;
	this.contentId = contentId;
	this.actionType = actionType;
	
	this.displayPeople = async function(newMsg){
		try {
			
			let actualPage = (this.page % 1 ? this.page - 0.5 : this.page);
			let peopleURL;
			let cast = 0;
			let crew = 0;
			let msg = '';
			if(this.actionType == ACTION_TYPES.personId){
				peopleURL = `https://api.themoviedb.org/3/search/person?api_key=${process.env.API_KEY}&language=en-US&query=${encodeURIComponent(this.query)}&page=${actualPage}&include_adult=false`;
				msg = `▶️ People ➡️ "${this.query}":`;
			}
			else if(this.actionType == ACTION_TYPES.popularPeople){
				peopleURL = `https://api.themoviedb.org/3/person/popular?api_key=${process.env.API_KEY}&language=en-US&page=${actualPage}`;
				msg = `▶️ Popular People`;
			}
			else {
				if(this.actionType == ACTION_TYPES.castMovies || this.actionType == ACTION_TYPES.castTv){
					cast = 1;
					msg = `▶️ Cast ➡️ "${this.query}":`;
				}
				else{
					crew = 1;
					msg = `▶️ Crew ➡️ "${this.query}":`
				}
				if(this.actionType == ACTION_TYPES.castMovies || this.actionType == ACTION_TYPES.crewMovies)
					peopleURL = `https://api.themoviedb.org/3/movie/${this.contentId}/credits?api_key=${process.env.API_KEY}&language=en-US`;
				else
					peopleURL = `https://api.themoviedb.org/3/tv/${this.contentId}/aggregate_credits?api_key=${process.env.API_KEY}&language=en-US`;
			}
			
			let menu = new SearchMenu(peopleURL, this.page);
			const keyboard = await menu.createMenu(SEARCH_TYPES.people, cast, crew);
			
			if(newMsg){
				bot.telegram.sendMessage(this.chatId, msg, keyboard.inline()).then(m => this.msgId = m.message_id);
			}
			else {
				bot.telegram.editMessageText(this.chatId, this.msgId, undefined, msg, keyboard.inline());
			}

		} catch(exception) {
			if(this.actionType == ACTION_TYPES.personId)
				msg = `❌ No people found matching "${this.query}"`;
			else if(this.actionType == ACTION_TYPES.castMovies || this.actionType == ACTION_TYPES.castTv)
				msg = `❌ No cast found for "${this.query}"`;
			else if(this.actionType == ACTION_TYPES.crewMovies || this.actionType == ACTION_TYPES.crewTv)
				msg = `❌ No crew found for "${this.query}"`;
			else if(this.actionType == ACTION_TYPES.popularPeople)
				msg = `❌ No popular people found`;
			bot.telegram.sendMessage(this.chatId, msg);
			return new Promise((resolve, reject) => {
				reject(this.msgId);
			})
		}
	}
}

export default PeopleSearchMenu;