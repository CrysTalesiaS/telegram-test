const Promise      = require('bluebird'),
      objectAssign = require('object-assign');
/**
 *
 * @param {object}[bot]
 * @param {int}[messageId]
 * @param {int}[updateId]
 * @constructor
 */

class TelegramTest {
  constructor(bot, messageId = 1000, updateId = 0) {
    bot.sendMessage = function (chatId, text, form = {}) {
      this.emit('testMessage', chatId, text, form);
    };
    bot.sendPhoto = function (chatId, photo, options = {}) {
      this.emit('testPhoto', chatId, photo, options);
    };
    this.messageId = messageId;
    this.updateId = updateId;
    this.bot = bot;
  }

  /**
   *
   * @param {string} messageText
   * @param {object} messageOptions
   * @return {{update_id: int, message: {message_id: int, from: {id: number,
 * first_name: string, username: string}, chat: {id: number,
 * first_name: string, username: string, type: string}, date: number, text: string}}}
   */
  makeMessage(messageText, messageOptions = {}) {
    const options = objectAssign({}, messageOptions);
    options.userId = options.userId || 1;
    options.chatId = options.chatId || 1;
    options.firstName = options.firstName || 'TestName';
    options.userName = options.userName || 'testUserName';
    options.type = options.type || 'private';
    options.date = options.date || (Math.floor(Date.now() / 1000));
    this.messageId++;
    this.updateId++;
    return {
      update_id: this.updateId,
      message: {
        message_id: this.messageId,
        from: {id: options.userId, first_name: options.firstName, username: options.userName},
        chat: {
          id: options.chatId,
          first_name: options.firstName,
          username: options.userName,
          type: options.type,
        },
        date: options.date,
        text: messageText,
      },
    };
  }

  /**
   *
   * @param chatId
   * @param action
   * @return {Promise}
   */
  sendUpdate(chatId, action) {
    const bot  = this.bot,
          self = this;
    return new Promise((resolve) => {
      bot.on('testMessage', function handler(msgChatId, text, form) {
        bot.removeListener('testMessage', handler);
        if (chatId === msgChatId) {
          if (form.reply_markup) {
            resolve({text, keyboard: JSON.parse(form.reply_markup).keyboard});
          } else resolve(self.sendUpdate(chatId));// wait until some available actions appear
        }
      });
      if (action !== undefined) {
        const msg = self.makeMessage(action, {chatId, userId: chatId});
        bot.processUpdate(msg);
      }
    });
  }
}
module.exports = TelegramTest;