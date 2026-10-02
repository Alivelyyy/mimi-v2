const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags
} = require("discord.js");
const blackEmoji = require("@assets/emojis/black.js");

const roasts = [
  "You're proof that even evolution takes a step backward sometimes.",
  "You bring everyone so much joy… when you leave the room.",
  "You're like a cloud. When you disappear, it's a beautiful day.",
  "Your secrets are safe with me. I never even listen when you tell me them.",
  "You're like a penny—two-faced and not really worth much.",
  "You bring everyone together… to talk about how annoying you are.",
  "You're not stupid; you just have bad luck thinking.",
  "I'd agree with you, but then we'd both be wrong.",
  "You're like a software update. Whenever I see you, I think, 'Not now.'",
  "Your jokes are so bad, even crickets refuse to acknowledge them.",
  "You're so slow, even a snail would tell you to hurry up.",
  "You're like a cloud—fluffy, full of hot air, and completely unnecessary.",
  "I'd explain it to you, but I left my crayons at home.",
  "You're proof that the universe has a sense of humor.",
  "You're the reason why shampoo bottles have instructions.",
  "You have something on your chin… no, the third one down.",
  "You're like a penny—shiny on the outside, but still worthless.",
  "You must have been born on a highway because that's where most accidents happen.",
  "Your brain is like a web browser—too many tabs open, but none of them are useful.",
  "You're so full of yourself, I'm surprised you don't float.",
  "You're the human equivalent of a participation trophy.",
  "Your voice is like a broken alarm clock—annoying and never on time.",
  "You're about as useful as a screen door on a submarine.",
  "You're the reason they put directions on shampoo bottles.",
  "You're like a candle—bright for a little while but eventually burned out.",
  "You're so dense, light bends around you.",
  "You're proof that not everyone needs a brain to survive.",
  "You're like a broken pencil—pointless.",
  "You're so irrelevant, even Google can't find you.",
  "You're like a software update—nobody asked for you, and you just make things worse.",
  "You're the human version of a pop-up ad.",
  "You're the reason they put instructions on toothpaste tubes.",
  "Your laugh sounds like a dying car engine.",
  "You're so annoying, even mosquitoes find you unbearable.",
  "You're the kind of person who claps when the plane lands.",
  "You're like an expired coupon—completely useless.",
  "You're the human version of autocorrect—always wrong but never admitting it.",
  "You're so awkward, even your shadow avoids you.",
  "You're like a clogged drain—nobody wants to deal with you, but we have to.",
  "You're the human version of a 404 error—lost and not found.",
  "You're like a joke without a punchline—completely pointless."
];

module.exports = {
  name: "roast",
  description: "Roast someone with a savage insult!",
  category: "fun",
  execute: async (client, message, args, emoji) => {
    const targetUser = message.mentions.users.first() || message.author;
    const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`${blackEmoji.fire} **${targetUser.username},** ${randomRoast}`)
    );
    message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
};
