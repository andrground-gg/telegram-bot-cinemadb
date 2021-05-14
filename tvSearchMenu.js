import Telegraf from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

import SearchMenu from './searchMenu.js';

import { ACTION_TYPES, SEARCH_TYPES } from './actionAndSearchTypes.js';

function TvSearchMenu(chatId, actionType, query = '', contentId = '') {
	this.page = 1;
	this.chatId = chatId;
	this.msgId = '';
	this.query = query;
	this.contentId = contentId;
	this.actionType = actionType;
	
	this.displayTv = async function(newMsg){
		try {
			
			let actualPage = (this.page % 1 ? this.page - 0.5 : this.page);
			let tvURL;
			let cast = 0;
			let crew = 0;
			let msg = '';
			if(this.actionType == ACTION_TYPES.tvId){
				tvURL = `https://api.themoviedb.org/3/search/tv?api_key=${process.env.API_KEY}&language=en-US&page=${actualPage}&query=${this.query}&include_adult=false`;
				msg = `▶️ TV Shows ➡️ "${this.query}":`;
			}
			else if(this.actionType == ACTION_TYPES.recommendTv){
				tvURL = `https://api.themoviedb.org/3/tv/${this.contentId}/recommendations?api_key=${process.env.API_KEY}&language=en-US&page=${actualPage}`;
				msg = `▶️ Recommendations ➡️ "${this.query}":`;
			}
			else if(this.actionType == ACTION_TYPES.starredInTv){
				cast = 1;
				crew = 1;
				tvURL = `https://api.themoviedb.org/3/person/${this.contentId}/tv_credits?api_key=${process.env.API_KEY}&language=en-US`;
				msg = `▶️ TV Shows ➡️ ${this.query}`;
			}
			else if(this.actionType == ACTION_TYPES.popularTv){
				tvURL = `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.API_KEY}&language=en-US&page=${actualPage}`;
				msg = `▶️ Popular TV Shows`;
			}

			let menu = new SearchMenu(tvURL, this.page);
			const keyboard = await menu.createMenu(SEARCH_TYPES.tvShows, cast, crew);			
			
			if(newMsg){
				bot.telegram.sendMessage(this.chatId, msg, keyboard.inline()).then(m => this.msgId = m.message_id);
			}
			else {
				bot.telegram.editMessageText(this.chatId, this.msgId, undefined, msg, keyboard.inline());
			}

		} catch(exception) {
			if(this.actionType == ACTION_TYPES.tvId)
				msg = `❌ No TV Shows found matching "${this.query}"`;
			else if(this.actionType == ACTION_TYPES.recommendTv)
				msg = `❌ No recommended TV Shows found for "${this.query}"`;
			else if(this.actionType == ACTION_TYPES.starredInTv)
				msg = `❌ No TV Shows found in which ${this.query} starred`;
			else if(this.actionType == ACTION_TYPES.popularTv)
				msg = `❌ No popular TV Shows found`;
			bot.telegram.sendMessage(this.chatId, msg);
			return new Promise((resolve, reject) => {
				reject(this.msgId);
			})
		}
	}
}

export default TvSearchMenu;