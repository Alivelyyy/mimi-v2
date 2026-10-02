module.exports = async (client, category) => {
  let commands = await client.commands
    .filter((x) => x.category && x.category === category)
    .map(
      (x) =>
        `${client.emoji.arrow} **\`${x.name}\` → [${
          x.description || "No description"
        }](${client.support})** ${x.new ? `${client.emoji.Vote}` : ""}${
          x.vote ? `${client.emoji.diamond}` : ""
        }`,
    )
    .join("\n");
  return commands || "**No commands to display**";
};
