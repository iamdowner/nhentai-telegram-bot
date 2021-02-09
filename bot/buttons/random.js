const nhentai = require("../../nhentai");

const { TelegraphUploadByUrls } = require("../telegraph.js");
const {
  getRandomManga,
  getRandomMangaLocaly,
  getMangaMessage,
} = require("../someFuncs.js");
const { saveAndGetUser } = require("../../db/saveAndGetUser");
const { saveAndGetManga } = require("../../db/saveAndGetManga");

const Manga = require("../../models/manga.model");
const Message = require("../../models/message.model");

module.exports.randomButton = async function(ctx) {
  ctx.reply("use @nhentai_mangabot instead")
  let user = await saveAndGetUser(ctx);

  let message = await Message.findOne({
    message_id: ctx.update.callback_query.message.message_id,
    chat_id: ctx.update.callback_query.message.from.id,
  });

  /* if something breaks (nhentai is down)
     user still can go back to prev opend mangas: */
  let waiting_keyboard = [
    [{ text: ctx.i18n.t("waitabit_button"), callback_data: "wait" }],
  ];
  if (message && message.current != 0) {
    waiting_keyboard[0].unshift({
      text: ctx.i18n.t("previous_button"),
      callback_data: "prev_",
    });
  }
  ctx
    .editMessageReplyMarkup({
      inline_keyboard: waiting_keyboard,
    })
    .catch((err) => {
      console.log(err);
    });

  if (!message) {
    message = new Message({
      chat_id: ctx.update.callback_query.message.from.id,
      message_id: ctx.update.callback_query.message.message_id,
      current: 0,
      history: [],
    });
  } else {
    message.current += 1;
  }

  let manga, telegraph_url;
  /* if user previously was clicking back button and he is not at the and of history
      [ 234, 123, 345, 1243, 356]  - history.length==5
             usr                    (current==1)
  */
  if (message.current < message.history.length) {

    manga = await saveAndGetManga(message.history[message.current]);


    // manga = await Manga.findOne({ id: message.history[message.current] });
    // incase manga|telegraph_url somehow disappeared from db - get_it() & save_it():
    // if (!manga || !manga.telegraph_url) {
    //   manga = await nhentai.getDoujin(message.history[message.current]);
    //   if (!manga) {
    //     console.log("!manga");
    //     return;
    //   }
    //   // here our telegraph page:
    //   telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
    //     console.log(err.status);
    //   });
    //   if (!telegraph_url) {
    //     return;
    //   }
    //   let savedManga = new Manga({
    //     id: manga.id,
    //     title: manga.title,
    //     description: manga.language,
    //     tags: manga.details.tags,
    //     telegraph_url: telegraph_url,
    //     pages: manga.details.pages,
    //   });
    //   savedManga.save(function(err) {
    //     if (err) return console.error(err);
    //     console.log("manga saved");
    //   });
    // } else {
    //   // here our telegraph page anyways:
    //   telegraph_url = manga.telegraph_fixed_url
    //     ? manga.telegraph_fixed_url
    //     : manga.telegraph_url;
    // }
  } else {
    /* if user at the end of history and looking for new manga:
         [ 234, 123, 345, 1243, 356]  - history.length==5
                                usr     (current==4)
    */
   manga = await saveAndGetManga(undefined, user);

    // let savedManga;
    // if (user.random_localy) {
    //   // (if randoming only in database records)
    //   manga = await getRandomMangaLocaly(
    //     user.default_random_tags,
    //     user.ignored_random_tags
    //   );

    //   let nothing_found_keyboard = [[{ text: "cant find anything :(" }]];
    //   if (manga == null) {
    //     // this can happen if user have very specific tags..
    //     if (message && message.current != 0) {
    //       nothing_found_keyboard[0].unshift({
    //         text: ctx.i18n.t("previous_button"),
    //         callback_data: "prev_",
    //       });
    //     }
    //     await ctx
    //       .editMessageReplyMarkup({
    //         reply_markup: {
    //           inline_keyboard: nothing_found_keyboard,
    //         },
    //       })
    //       .catch((err) => {
    //         console.log(err);
    //       });
    //     return;
    //   }
    //   // here our telegraph page anyways:
    //   telegraph_url = manga.telegraph_fixed_url
    //     ? manga.telegraph_fixed_url
    //     : manga.telegraph_url;

    //   // incase manga was somehow saved without telegraph url:
    //   if (!telegraph_url) {
    //     telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
    //       console.log(typeof err);
    //       console.log(err.Error);
    //       console.log(err.match(/FLOOD_WAIT_\d+/));
    //       console.log(err);
    //       // some err handling ¯\_(ツ)_/¯
    //     });
    //     if (!telegraph_url) {
    //       console.log("!telegraph_url - return");
    //       return;
    //     }
    //     manga.telegraph_url = telegraph_url;
    //     manga.save(function(err) {
    //       if (err) return console.error(err);
    //       console.log("manga saved");
    //     });
    //   }
    //   // incase manga was saved without date
    //   if (!manga.date) {
    //     manga.date = Date.now;
    //     manga.save(function(err) {
    //       if (err) return console.error(err);
    //     });
    //   }
    //   console.log(manga.date)
    // } else {
    //   // (if not localy)
    //   manga = await getRandomManga().catch((err) => {
    //     console.log(err);
    //   });

    //   if (!manga) {
    //     console.log("!manga - return");
    //     return;
    //   }
    //   console.log(manga.id);
    //   let isMangaSaved = await Manga.findOne({
    //     id: manga.id,
    //   });
    //   if (!isMangaSaved || !isMangaSaved.telegraph_url) {
    //     telegraph_url = await TelegraphUploadByUrls(manga).catch((err) => {
    //       console.log(typeof err);
    //       console.log(err.Error);
    //       console.log(err.match(/FLOOD_WAIT_\d+/));
    //       console.log(err);
    //       // -err handling? -yes.
    //     });
    //     if (!telegraph_url) {
    //       console.log("!telegraph_url - return");
    //       return;
    //     }
    //   } else {
    //     telegraph_url = isMangaSaved.telegraph_fixed_url
    //       ? isMangaSaved.telegraph_fixed_url
    //       : isMangaSaved.telegraph_url;
    //   }

    //   if (!isMangaSaved) {
    //     savedManga = new Manga({
    //       id: manga.id,
    //       title: manga.title,
    //       description: manga.language,
    //       tags: manga.details.tags,
    //       telegraph_url: telegraph_url,
    //       pages: manga.details.pages,
    //       thumbnail: manga.thumbnails[0],
    //     });
    //     savedManga.save(function(err) {
    //       if (err) return console.error(err);
    //       console.log("manga saved");
    //     });
    //   }
    // }

    message.history.push(manga.id);
    if (message.history.length > 400) {
      // (i have only 500mb bro stop)
      for (let t = message.history.length; t > 200; t--) {
        message.history.shift();
      }
    }
  }

  user.manga_history.push(manga.id);
  if (user.manga_history.length > 200) {
    // you don't need so much history, do you?
    for (let t = user.manga_history.length; t > 200; t--) {
      user.manga_history.shift();
    }
  }
  message.save();
  user.save();
  
  telegraph_url = manga.telegraph_fixed_url
  ? manga.telegraph_fixed_url
  : manga.telegraph_url;

  let messageText = getMangaMessage(manga, telegraph_url, ctx.i18n),
    heart = user.favorites.id(manga.id) ? "♥️" : "🖤";
  inline_keyboard = [
    [
      { text: "Telegra.ph", url: telegraph_url },
      { text: heart, callback_data: "like_" + manga.id },
    ],
    [
      {
        text: ctx.i18n.t("search_button"),
        switch_inline_query_current_chat: "",
      },
    ],
    [{ text: ctx.i18n.t("next_button"), callback_data: "r_" + manga.id }],
  ];

  // in db number of pages in 'pages' var, but in nhentai it's in 'details.pages':
  let num_of_pages = manga.details ? manga.details.pages : manga.pages;
  /* for those who click buttons without any reason
     show fix button only if there is really a lot of pages: */
  if (!manga.telegraph_fixed_url && num_of_pages > 150) {
    inline_keyboard[0].unshift({
      text: ctx.i18n.t("fix_button"),
      callback_data: "fix_" + manga.id,
    });
  }
  if (message.current > 0) {
    inline_keyboard[2].unshift({
      text: ctx.i18n.t("previous_button"),
      callback_data: "prev_" + manga.id,
    });
  }
  // finally!
  await ctx
    .editMessageText(messageText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: inline_keyboard,
      },
    })
    .catch((err) => {
      console.log(err.code);
    });
};
